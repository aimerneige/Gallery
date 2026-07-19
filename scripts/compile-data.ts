import * as fs from 'fs';
import * as path from 'path';

// Define expected types
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
  flash?: string;
}

interface LocationInfo {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface PhotoSource {
  id: string;
  title: string;
  description: string;
  r2Url: string;
  width: number;
  height: number;
  camera: CameraInfo;
  exif: ExifInfo;
  location: LocationInfo;
  albums: string[];
  tags: string[];
}

interface AlbumSource {
  id: string;
  name: string;
  description: string;
  coverPhotoId: string;
}

interface GalleryDatabase {
  albums: AlbumSource[];
  photos: PhotoSource[];
}

interface CompiledPhoto extends PhotoSource {
  aspectRatio: number;
}

interface CompiledAlbum extends AlbumSource {
  coverPhotoUrl: string;
}

interface CompiledDatabase {
  albums: CompiledAlbum[];
  photos: CompiledPhoto[];
}

const DATA_DIR = path.resolve('data');
const PUBLIC_DIR = path.resolve('public');
const SOURCE_FILE = path.join(DATA_DIR, 'gallery.json');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'data.json');

function compile() {
  console.log('--- Starting NicoGallery Compilation ---');
  
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`Error: Source file not found at ${SOURCE_FILE}`);
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(SOURCE_FILE, 'utf8');
    const sourceDb: GalleryDatabase = JSON.parse(rawData);

    console.log(`Successfully parsed source database: ${sourceDb.photos.length} photos, ${sourceDb.albums.length} albums.`);

    // 1. Process Photos and calculate Aspect Ratio
    const compiledPhotos: CompiledPhoto[] = sourceDb.photos.map((photo) => {
      if (!photo.id || !photo.title || !photo.r2Url || !photo.width || !photo.height) {
        throw new Error(`Invalid photo object: Missing required fields on photo ID: ${photo.id || 'unknown'}`);
      }
      
      const aspectRatio = parseFloat((photo.width / photo.height).toFixed(3));
      
      return {
        ...photo,
        aspectRatio
      };
    });

    // 2. Process Albums and map cover photo URLs
    const compiledAlbums: CompiledAlbum[] = sourceDb.albums.map((album) => {
      const coverPhoto = compiledPhotos.find(p => p.id === album.coverPhotoId);
      if (!coverPhoto) {
        console.warn(`Warning: Cover photo ID "${album.coverPhotoId}" not found for album "${album.id}".`);
      }
      
      return {
        ...album,
        coverPhotoUrl: coverPhoto ? coverPhoto.r2Url : ''
      };
    });

    const compiledDb: CompiledDatabase = {
      albums: compiledAlbums,
      photos: compiledPhotos
    };

    // Make sure output folder exists
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    // Write minified output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(compiledDb), 'utf8');
    console.log(`Compiled data successfully written to ${OUTPUT_FILE}`);
    
    // Log file sizes for validation
    const sourceSize = (fs.statSync(SOURCE_FILE).size / 1024).toFixed(2);
    const outputSize = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
    console.log(`Source Size: ${sourceSize} KB | Compiled Size: ${outputSize} KB`);
    console.log('--- Compilation Finished Successfully ---');
  } catch (error) {
    console.error('Compilation failed due to error:', error);
    process.exit(1);
  }
}

compile();
