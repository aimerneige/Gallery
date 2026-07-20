import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { parseExif } from './exif.js';
import { processImage } from './image.js';
import { uploadToR2, getR2ConfigFromEnv } from './storage.js';
import {
  getAllGalleryData,
  saveOrUpdatePhoto,
  deletePhoto,
  saveOrUpdateAlbum,
  deleteAlbum,
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const ROOT_DIR = path.resolve(process.cwd(), '../../');
const ENV_FILE_PATH = path.join(process.cwd(), '.env');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Memory storage for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Helper to trigger compilation script
function triggerCompilation() {
  const scriptPath = path.join(ROOT_DIR, 'scripts', 'compile-data.ts');
  console.log('Triggering data compilation script...');
  exec(`npx tsx "${scriptPath}"`, { cwd: ROOT_DIR }, (error, stdout) => {
    if (error) {
      console.error('Compilation error:', error);
    } else {
      console.log('Compilation output:', stdout);
    }
  });
}

// 1. GET /api/data - Get current gallery database from SQLite
app.get('/api/data', (_req, res) => {
  try {
    const data = getAllGalleryData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to read gallery database', details: err.message });
  }
});

// 2. POST /api/extract-exif - Analyze image file and extract EXIF data
app.post('/api/extract-exif', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const buffer = req.file.buffer;
    const exifResult = await parseExif(buffer);

    // Process thumbnail preview base64
    const preview = await processImage(buffer, { maxDimension: 600, quality: 60 });
    const previewBase64 = `data:image/webp;base64,${preview.buffer.toString('base64')}`;

    // Get full size image dimensions if EXIF didn't supply them
    if (!exifResult.width || !exifResult.height) {
      const fullProcessed = await processImage(buffer, { maxDimension: 3000, quality: 80 });
      exifResult.width = fullProcessed.width;
      exifResult.height = fullProcessed.height;
    }

    // Generate suggested ID from filename
    const originalName = req.file.originalname;
    const baseName = path.parse(originalName).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const suggestedId = baseName || `photo-${Date.now()}`;

    res.json({
      suggestedId,
      previewUrl: previewBase64,
      width: exifResult.width,
      height: exifResult.height,
      camera: exifResult.camera,
      exif: exifResult.exif,
      location: exifResult.location,
    });
  } catch (err: any) {
    console.error('EXIF extraction error:', err);
    res.status(500).json({ error: 'Failed to extract EXIF data', details: err.message });
  }
});

// 3. POST /api/upload - Process, Upload to R2, and Save Photo to SQLite DB
app.post('/api/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo provided' });
    }

    const bodyData = typeof req.body.metadata === 'string' ? JSON.parse(req.body.metadata) : req.body;
    const {
      id,
      title,
      description,
      camera,
      exif,
      location,
      albums = [],
      tags = [],
      quality = 80,
      maxDimension = 1600,
    } = bodyData;

    if (!id || !title) {
      return res.status(400).json({ error: 'Photo ID and Title are required' });
    }

    // Process image to WebP
    const processed = await processImage(req.file.buffer, { maxDimension: Number(maxDimension), quality: Number(quality) });

    // Upload strictly to Cloudflare R2
    const config = getR2ConfigFromEnv();
    const filename = `${id}.webp`;
    const r2Url = await uploadToR2(processed.buffer, filename, config);

    const newPhoto = {
      id,
      title,
      description: description || '',
      r2Url,
      width: processed.width,
      height: processed.height,
      camera: {
        make: camera?.make || 'Unknown Make',
        model: camera?.model || 'Unknown Model',
        lens: camera?.lens || 'Unknown Lens',
      },
      exif: {
        aperture: exif?.aperture || 'f/2.8',
        shutterSpeed: exif?.shutterSpeed || '1/125s',
        iso: Number(exif?.iso) || 100,
        focalLength: Number(exif?.focalLength) || 35,
        focalLength35mm: exif?.focalLength35mm ? Number(exif.focalLength35mm) : undefined,
        dateTaken: exif?.dateTaken || new Date().toISOString(),
        exposureProgram: exif?.exposureProgram,
        meteringMode: exif?.meteringMode,
      },
      location: {
        name: location?.name || '',
        latitude: location?.latitude ? Number(location.latitude) : undefined,
        longitude: location?.longitude ? Number(location.longitude) : undefined,
      },
      albums: Array.isArray(albums) ? albums : [],
      tags: Array.isArray(tags) ? tags : [],
    };

    saveOrUpdatePhoto(newPhoto);
    triggerCompilation();

    res.json({ success: true, photo: newPhoto });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process and upload photo', details: err.message });
  }
});

// 4. PUT /api/photos/:id - Update existing photo in SQLite DB
app.put('/api/photos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const photoData = { ...req.body, id };

    saveOrUpdatePhoto(photoData);
    triggerCompilation();

    res.json({ success: true, photo: photoData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update photo', details: err.message });
  }
});

// 5. DELETE /api/photos/:id - Delete photo from SQLite DB
app.delete('/api/photos/:id', (req, res) => {
  try {
    const { id } = req.params;
    deletePhoto(id);
    triggerCompilation();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete photo', details: err.message });
  }
});

// 6. POST /api/albums - Create album in SQLite DB
app.post('/api/albums', (req, res) => {
  try {
    const { id, name, description, coverPhotoId } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'Album ID and Name are required' });
    }

    saveOrUpdateAlbum({ id, name, description, coverPhotoId });
    triggerCompilation();

    res.json({ success: true, album: { id, name, description, coverPhotoId } });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create album', details: err.message });
  }
});

// 7. PUT /api/albums/:id - Update album in SQLite DB
app.put('/api/albums/:id', (req, res) => {
  try {
    const { id } = req.params;
    const albumData = { ...req.body, id };

    saveOrUpdateAlbum(albumData);
    triggerCompilation();

    res.json({ success: true, album: albumData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update album', details: err.message });
  }
});

// 8. DELETE /api/albums/:id - Delete album from SQLite DB
app.delete('/api/albums/:id', (req, res) => {
  try {
    const { id } = req.params;
    deleteAlbum(id);
    triggerCompilation();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete album', details: err.message });
  }
});

// 9. GET & POST /api/config - Manage R2 configuration
app.get('/api/config', (_req, res) => {
  const config = getR2ConfigFromEnv();
  res.json({
    ...config,
    secretAccessKey: config.secretAccessKey ? '••••••••' : '', // mask secret
  });
});

app.post('/api/config', (req, res) => {
  try {
    const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlPrefix } = req.body;

    const updates: Record<string, string> = {
      R2_ACCOUNT_ID: accountId || '',
      R2_ACCESS_KEY_ID: accessKeyId || '',
      R2_BUCKET_NAME: bucketName || 'nicogallery',
      R2_PUBLIC_URL_PREFIX: publicUrlPrefix || '',
    };

    if (secretAccessKey && secretAccessKey !== '••••••••') {
      updates.R2_SECRET_ACCESS_KEY = secretAccessKey;
    }

    // Write to process.env and .env file
    Object.entries(updates).forEach(([key, val]) => {
      process.env[key] = val;
    });

    const newEnvLines = Object.entries(updates).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(ENV_FILE_PATH, newEnvLines.join('\n'), 'utf8');

    res.json({ success: true, config: getR2ConfigFromEnv() });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update configuration', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`NicoGallery Local Management Server running at http://localhost:${PORT}`);
});
