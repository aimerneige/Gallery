import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import * as YAML from 'yaml';

interface LocalizedString {
  en?: string;
  zh?: string;
}

export interface SiteConfig {
  site: {
    title: string | LocalizedString;
    description: string;
    logoIcon: 'camera' | 'aperture' | 'collections' | 'photo' | 'none';
    githubUrl?: string;
    showLanguageToggle: boolean;
    showThemeToggle: boolean;
  };
  hero: {
    showHero: boolean;
    overline: string | LocalizedString;
    titleLine1: string | LocalizedString;
    titleLine2: string | LocalizedString;
    subtitle: string | LocalizedString;
    showStats: boolean;
  };
  theme: {
    defaultMode: 'dark' | 'light' | 'system';
  };
  gallery: {
    defaultSortBy: string;
  };
  footer: {
    showFooter: boolean;
    copyright: string;
    caption: string;
  };
}

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
  author?: string;
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
  config: SiteConfig;
  albums: CompiledAlbum[];
  photos: CompiledPhoto[];
}

const DATA_DIR = path.resolve('data');
const PUBLIC_DIR = path.resolve('public');
const CONFIG_FILE = path.resolve('config.yaml');
const DB_FILE = path.join(DATA_DIR, 'gallery.db');
const PUBLIC_JSON_FILE = path.join(PUBLIC_DIR, 'data.json');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'data.json');

const DEFAULT_CONFIG_YAML = `# ==========================================
# NicoGallery - 项目全局配置文件 (config.yaml)
# 普通用户无需修改代码，修改此文件后重新编译即可生效
# ==========================================

# 网站与顶栏设置 (Site & Header Settings)
site:
  # 左上角顶栏标题 (Navigation Header Title)
  # 支持单字符串（如 "GALLERY"），或针对中/英文指定不同标题：
  # title:
  #   en: "NicoGallery"
  #   zh: "Nico画廊"
  title: "GALLERY"

  # 页面 SEO 描述 (SEO Meta Description)
  description: "A modern photography portfolio featuring rich EXIF metadata and interactive collections."

  # 顶栏左侧图标 (Logo Icon): "camera" | "aperture" | "collections" | "photo" | "none"
  logoIcon: "camera"

  # GitHub 链接 (若为空或留空，则隐藏右上角 GitHub 图标按钮)
  githubUrl: "https://github.com/aimerneige/NicoGallery"

  # 是否显示双语切换按钮 (Show Language Switcher)
  showLanguageToggle: true

  # 是否显示深浅色主题切换按钮 (Show Theme Toggle Button)
  showThemeToggle: true

# 首页 Hero 顶部横幅设置 (Hero Banner Settings)
hero:
  # 是否开启 Hero 顶部横幅 (Enable Hero Section)
  showHero: true

  # 顶部小标题 (Overline Text)
  overline:
    en: "PHOTOGRAPHY PORTFOLIO"
    zh: "个人摄影作品集"

  # 主标题第一行 (Title Line 1)
  titleLine1:
    en: "Captured Moments &"
    zh: "定格光影瞬间与"

  # 主标题第二行 (渐变高亮 Title Line 2)
  titleLine2:
    en: "EXIF Metadata"
    zh: "EXIF 拍摄参数"

  # 描述副标题 (Subtitle Description)
  subtitle:
    en: "A visual log of street, landscape, and minimal photography. Click on any photograph to inspect full shooting parameters, camera settings, lens details, and capture location."
    zh: "街头、风光与极简主义摄影的视觉记录。点击任意照片即可查看完整拍摄参数、相机镜头细节及地理位置。"

  # 是否显示数据统计面板 (Show Stats Cards: Photographs, Collections, Cameras, Lenses)
  showStats: true

# 外观与主题设置 (Theme Settings)
theme:
  # 默认主题模式 (Default Theme Mode): "dark" | "light" | "system"
  defaultMode: "dark"

# 画廊展示与排序 (Gallery Settings)
gallery:
  # 默认排序方式 (Default Sort Order): "date-desc" | "date-asc" | "focal-desc" | "focal-asc" | "iso-asc"
  defaultSortBy: "date-desc"

# 页脚设置 (Footer Settings)
footer:
  # 是否显示页脚 (Show Footer)
  showFooter: true

  # 版权信息 (Copyright Text)
  copyright: "Gallery. All rights reserved."

  # 页脚说明文本 (Footer Caption)
  caption: "Built with React, Vite & Material UI. Images delivered via Cloudflare R2."
`;

export function loadSiteConfig(): SiteConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.log('config.yaml not found. Creating default config.yaml...');
    fs.writeFileSync(CONFIG_FILE, DEFAULT_CONFIG_YAML, 'utf8');
  }

  try {
    const rawContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const parsed = YAML.parse(rawContent) || {};
    const defaultConfig = YAML.parse(DEFAULT_CONFIG_YAML);

    return {
      site: {
        title: parsed.site?.title ?? defaultConfig.site.title,
        description: parsed.site?.description ?? defaultConfig.site.description,
        logoIcon: parsed.site?.logoIcon ?? defaultConfig.site.logoIcon,
        githubUrl: parsed.site?.githubUrl !== undefined ? parsed.site.githubUrl : defaultConfig.site.githubUrl,
        showLanguageToggle: parsed.site?.showLanguageToggle ?? defaultConfig.site.showLanguageToggle,
        showThemeToggle: parsed.site?.showThemeToggle ?? defaultConfig.site.showThemeToggle,
      },
      hero: {
        showHero: parsed.hero?.showHero ?? defaultConfig.hero.showHero,
        overline: parsed.hero?.overline ?? defaultConfig.hero.overline,
        titleLine1: parsed.hero?.titleLine1 ?? defaultConfig.hero.titleLine1,
        titleLine2: parsed.hero?.titleLine2 ?? defaultConfig.hero.titleLine2,
        subtitle: parsed.hero?.subtitle ?? defaultConfig.hero.subtitle,
        showStats: parsed.hero?.showStats ?? defaultConfig.hero.showStats,
      },
      theme: {
        defaultMode: parsed.theme?.defaultMode ?? defaultConfig.theme.defaultMode,
      },
      gallery: {
        defaultSortBy: parsed.gallery?.defaultSortBy ?? defaultConfig.gallery.defaultSortBy,
      },
      footer: {
        showFooter: parsed.footer?.showFooter ?? defaultConfig.footer.showFooter,
        copyright: parsed.footer?.copyright ?? defaultConfig.footer.copyright,
        caption: parsed.footer?.caption ?? defaultConfig.footer.caption,
      },
    };
  } catch (err) {
    console.error('Error reading/parsing config.yaml, falling back to defaults:', err);
    return YAML.parse(DEFAULT_CONFIG_YAML);
  }
}


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
      author TEXT,
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

  // Migrate schema safely if author column missing in existing db
  try {
    db.exec(`ALTER TABLE photos ADD COLUMN author TEXT;`);
  } catch {
    // Column already exists
  }
}

function seedFromPublicJson(db: Database.Database) {
  if (!fs.existsSync(PUBLIC_JSON_FILE)) return;

  const countPhotos: any = db.prepare('SELECT COUNT(*) as count FROM photos').get();
  if (countPhotos.count > 0) return; // DB already initialized and populated

  console.log('Seeding SQLite database gallery.db from public/data.json...');
  try {
    const raw = fs.readFileSync(PUBLIC_JSON_FILE, 'utf8');
    const jsonDb = JSON.parse(raw);

    const insertAlbum = db.prepare(`
      INSERT OR REPLACE INTO albums (id, name, description, cover_photo_id)
      VALUES (?, ?, ?, ?)
    `);

    const insertPhoto = db.prepare(`
      INSERT OR REPLACE INTO photos (
        id, title, description, author, r2_url, width, height,
        camera_make, camera_model, camera_lens,
        aperture, shutter_speed, iso, focal_length, focal_length_35mm,
        date_taken, exposure_program, metering_mode,
        location_name, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          p.author || '',
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
    console.log('Seeding SQLite database from public/data.json completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

export function exportSqliteToJson(dbFile: string): CompiledDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(dbFile);
  initDatabaseSchema(db);
  seedFromPublicJson(db);

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
      author: p.author || undefined,
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

  const config = loadSiteConfig();

  return {
    config,
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
