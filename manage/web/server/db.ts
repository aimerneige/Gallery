import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const ROOT_DIR = path.resolve(process.cwd(), '../../');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'gallery.db');

export function getDbConnection() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_FILE_PATH);
  
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

  return db;
}

export function getAllGalleryData() {
  const db = getDbConnection();
  try {
    const albums: any[] = db.prepare('SELECT id, name, description, cover_photo_id as coverPhotoId FROM albums').all();
    const photos: any[] = db.prepare('SELECT * FROM photos').all();

    const getAlbumsStmt = db.prepare('SELECT album_id FROM photo_albums WHERE photo_id = ?');
    const getTagsStmt = db.prepare('SELECT tag FROM photo_tags WHERE photo_id = ?');

    const formattedPhotos = photos.map((p) => {
      const photoAlbums = getAlbumsStmt.all(p.id).map((r: any) => r.album_id);
      const photoTags = getTagsStmt.all(p.id).map((r: any) => r.tag);

      return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        r2Url: p.r2_url,
        width: p.width,
        height: p.height,
        aspectRatio: parseFloat((p.width / p.height).toFixed(3)),
        camera: {
          make: p.camera_make || '',
          model: p.camera_model || '',
          lens: p.camera_lens || '',
        },
        exif: {
          aperture: p.aperture || '',
          shutterSpeed: p.shutter_speed || '',
          iso: p.iso || 100,
          focalLength: p.focal_length || 35,
          focalLength35mm: p.focal_length_35mm || undefined,
          dateTaken: p.date_taken || '',
          exposureProgram: p.exposure_program || undefined,
          meteringMode: p.metering_mode || undefined,
        },
        location: {
          name: p.location_name || '',
          latitude: p.latitude || undefined,
          longitude: p.longitude || undefined,
        },
        albums: photoAlbums,
        tags: photoTags,
      };
    });

    return { albums, photos: formattedPhotos };
  } finally {
    db.close();
  }
}

export function saveOrUpdatePhoto(photoData: any) {
  const db = getDbConnection();
  try {
    const insertPhoto = db.prepare(`
      INSERT OR REPLACE INTO photos (
        id, title, description, r2_url, width, height,
        camera_make, camera_model, camera_lens,
        aperture, shutter_speed, iso, focal_length, focal_length_35mm,
        date_taken, exposure_program, metering_mode,
        location_name, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const deleteAlbums = db.prepare('DELETE FROM photo_albums WHERE photo_id = ?');
    const insertAlbum = db.prepare('INSERT INTO photo_albums (photo_id, album_id) VALUES (?, ?)');

    const deleteTags = db.prepare('DELETE FROM photo_tags WHERE photo_id = ?');
    const insertTag = db.prepare('INSERT INTO photo_tags (photo_id, tag) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      insertPhoto.run(
        photoData.id,
        photoData.title,
        photoData.description || '',
        photoData.r2Url,
        photoData.width,
        photoData.height,
        photoData.camera?.make || '',
        photoData.camera?.model || '',
        photoData.camera?.lens || '',
        photoData.exif?.aperture || '',
        photoData.exif?.shutterSpeed || '',
        photoData.exif?.iso || 100,
        photoData.exif?.focalLength || 35,
        photoData.exif?.focalLength35mm || null,
        photoData.exif?.dateTaken || new Date().toISOString(),
        photoData.exif?.exposureProgram || null,
        photoData.exif?.meteringMode || null,
        photoData.location?.name || '',
        photoData.location?.latitude || null,
        photoData.location?.longitude || null
      );

      deleteAlbums.run(photoData.id);
      for (const albumId of photoData.albums || []) {
        insertAlbum.run(photoData.id, albumId);
      }

      deleteTags.run(photoData.id);
      for (const tag of photoData.tags || []) {
        insertTag.run(photoData.id, tag);
      }
    });

    transaction();
  } finally {
    db.close();
  }
}

export function deletePhoto(photoId: string) {
  const db = getDbConnection();
  try {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM photo_albums WHERE photo_id = ?').run(photoId);
      db.prepare('DELETE FROM photo_tags WHERE photo_id = ?').run(photoId);
      db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
    });
    transaction();
  } finally {
    db.close();
  }
}

export function saveOrUpdateAlbum(album: { id: string; name: string; description?: string; coverPhotoId?: string }) {
  const db = getDbConnection();
  try {
    db.prepare(`
      INSERT OR REPLACE INTO albums (id, name, description, cover_photo_id)
      VALUES (?, ?, ?, ?)
    `).run(album.id, album.name, album.description || '', album.coverPhotoId || '');
  } finally {
    db.close();
  }
}

export function deleteAlbum(albumId: string) {
  const db = getDbConnection();
  try {
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM photo_albums WHERE album_id = ?').run(albumId);
      db.prepare('DELETE FROM albums WHERE id = ?').run(albumId);
    });
    transaction();
  } finally {
    db.close();
  }
}
