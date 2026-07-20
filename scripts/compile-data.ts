import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

interface CameraInfo {
  make: string;
  model: string;
  lens: string;
}

interface ExifInfo {
  aperture: string;
  shutterSpeed: string;
  iso: number;
  focalLength: number;
  focalLength35mm?: number;
  dateTaken: string;
  exposureProgram?: string;
  meteringMode?: string;
}

interface LocationInfo {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface CompiledPhoto {
  id: string;
  title: string;
  description: string;
  r2Url: string;
  width: number;
  height: number;
  aspectRatio: number;
  camera: CameraInfo;
  exif: ExifInfo;
  location: LocationInfo;
  albums: string[];
  tags: string[];
}

interface CompiledAlbum {
  id: string;
  name: string;
  description: string;
  coverPhotoId: string;
  coverPhotoUrl: string;
}

interface CompiledDatabase {
  albums: CompiledAlbum[];
  photos: CompiledPhoto[];
}

const DATA_DIR = path.resolve('data');
const PUBLIC_DIR = path.resolve('public');
const DB_FILE = path.join(DATA_DIR, 'gallery.db');
const JSON_SOURCE_FILE = path.join(DATA_DIR, 'gallery.json');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'data.json');

export function initDatabaseSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      cover_photo_id TEXT
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      r2_url TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      camera_make TEXT,
      camera_model TEXT,
      camera_lens TEXT,
      aperture TEXT,
      shutter_speed TEXT,
      iso INTEGER,
      focal_length REAL,
      focal_length_35mm REAL,
      date_taken TEXT,
      exposure_program TEXT,
      metering_mode TEXT,
      location_name TEXT,
      latitude REAL,
      longitude REAL
    );

    CREATE TABLE IF NOT EXISTS photo_albums (
      photo_id TEXT NOT NULL,
      album_id TEXT NOT NULL,
      PRIMARY KEY (photo_id, album_id),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS photo_tags (
      photo_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (photo_id, tag),
      FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
    );
  `);
}

function migrateFromJson(db: Database.Database) {
  if (!fs.existsSync(JSON_SOURCE_FILE)) return;

  const countPhotos: any = db.prepare('SELECT COUNT(*) as count FROM photos').get();
  if (countPhotos.count > 0) return; // DB already has data

  console.log('Migrating existing gallery.json data to SQLite database...');
  try {
    const raw = fs.readFileSync(JSON_SOURCE_FILE, 'utf8');
    const jsonDb = JSON.parse(raw);

    const insertAlbum = db.prepare(`
      INSERT OR REPLACE INTO albums (id, name, description, cover_photo_id)
      VALUES (?, ?, ?, ?)
    `);

    const insertPhoto = db.prepare(`
      INSERT OR REPLACE INTO photos (
        id, title, description, r2_url, width, height,
        camera_make, camera_model, camera_lens,
        aperture, shutter_speed, iso, focal_length, focal_length_35mm,
        date_taken, exposure_program, metering_mode,
        location_name, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPhotoAlbum = db.prepare(`
      INSERT OR REPLACE INTO photo_albums (photo_id, album_id) VALUES (?, ?)
    `);

    const insertPhotoTag = db.prepare(`
      INSERT OR REPLACE INTO photo_tags (photo_id, tag) VALUES (?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const album of jsonDb.albums || []) {
        insertAlbum.run(album.id, album.name, album.description || '', album.coverPhotoId || '');
      }

      for (const p of jsonDb.photos || []) {
        insertPhoto.run(
          p.id,
          p.title,
          p.description || '',
          p.r2Url,
          p.width,
          p.height,
          p.camera?.make || '',
          p.camera?.model || '',
          p.camera?.lens || '',
          p.exif?.aperture || '',
          p.exif?.shutterSpeed || '',
          p.exif?.iso || 100,
          p.exif?.focalLength || 35,
          p.exif?.focalLength35mm || null,
          p.exif?.dateTaken || new Date().toISOString(),
          p.exif?.exposureProgram || null,
          p.exif?.meteringMode || null,
          p.location?.name || '',
          p.location?.latitude || null,
          p.location?.longitude || null
        );

        for (const albumId of p.albums || []) {
          insertPhotoAlbum.run(p.id, albumId);
        }

        for (const tag of p.tags || []) {
          insertPhotoTag.run(p.id, tag);
        }
      }
    });

    transaction();
    console.log('Migration to SQLite completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

export function exportSqliteToJson(dbFile: string): CompiledDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(dbFile);
  initDatabaseSchema(db);
  migrateFromJson(db);

  // Fetch albums
  const albumRows: any[] = db.prepare('SELECT * FROM albums').all();

  // Fetch photos
  const photoRows: any[] = db.prepare('SELECT * FROM photos').all();

  // Prepare statement for albums and tags
  const getPhotoAlbumsStmt = db.prepare('SELECT album_id FROM photo_albums WHERE photo_id = ?');
  const getPhotoTagsStmt = db.prepare('SELECT tag FROM photo_tags WHERE photo_id = ?');

  const compiledPhotos: CompiledPhoto[] = photoRows.map((p) => {
    const albums = getPhotoAlbumsStmt.all(p.id).map((r: any) => r.album_id);
    const tags = getPhotoTagsStmt.all(p.id).map((r: any) => r.tag);
    const aspectRatio = parseFloat((p.width / p.height).toFixed(3));

    return {
      id: p.id,
      title: p.title,
      description: p.description || '',
      r2Url: p.r2_url,
      width: p.width,
      height: p.height,
      aspectRatio,
      camera: {
        make: p.camera_make || '',
        model: p.camera_model || '',
        lens: p.camera_lens || '',
      },
      exif: {
        aperture: p.aperture || 'f/2.8',
        shutterSpeed: p.shutter_speed || '1/125s',
        iso: p.iso || 100,
        focalLength: p.focal_length || 35,
        focalLength35mm: p.focal_length_35mm || undefined,
        dateTaken: p.date_taken || new Date().toISOString(),
        exposureProgram: p.exposure_program || undefined,
        meteringMode: p.metering_mode || undefined,
      },
      location: {
        name: p.location_name || '',
        latitude: p.latitude || undefined,
        longitude: p.longitude || undefined,
      },
      albums,
      tags,
    };
  });

  const compiledAlbums: CompiledAlbum[] = albumRows.map((a) => {
    const coverPhoto = compiledPhotos.find((p) => p.id === a.cover_photo_id) || compiledPhotos.find((p) => p.albums.includes(a.id));
    return {
      id: a.id,
      name: a.name,
      description: a.description || '',
      coverPhotoId: a.cover_photo_id || '',
      coverPhotoUrl: coverPhoto ? coverPhoto.r2Url : '',
    };
  });

  db.close();

  return {
    albums: compiledAlbums,
    photos: compiledPhotos,
  };
}

function compile() {
  console.log('--- Starting NicoGallery SQLite Compilation ---');
  try {
    const compiledDb = exportSqliteToJson(DB_FILE);

    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(compiledDb), 'utf8');
    console.log(`Compiled JSON successfully exported from SQLite to ${OUTPUT_FILE}`);
    console.log(`Exported ${compiledDb.photos.length} photos and ${compiledDb.albums.length} albums.`);
    console.log('--- Compilation Finished Successfully ---');
  } catch (error) {
    console.error('Compilation failed:', error);
    process.exit(1);
  }
}

// Execute compilation if called directly
compile();
