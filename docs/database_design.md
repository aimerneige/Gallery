# NicoGallery - Database Design Documentation

This document defines the schema design for the photography gallery. It supports both a relational database layout (SQLite) and a compiled static layout (JSON) that the React frontend consumes.

---

## 1. SQLite Relational Schema Design

For the future management tool, a relational database is recommended to avoid duplicates and ensure database normalization. Below is the Entity-Relationship schema.

### Tables

#### 1. `photos`
Stores metadata and details about individual photograph assets.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique UUID or slug |
| `title` | TEXT | NOT NULL | Title of the photograph |
| `description`| TEXT | | Long-form story or details about the photo |
| `r2_url` | TEXT | NOT NULL | Cloudflare R2 public delivery URL |
| `width` | INTEGER | NOT NULL | Original image width in pixels |
| `height` | INTEGER | NOT NULL | Original image height in pixels |
| `aspect_ratio`| REAL | NOT NULL | Computed width / height |
| `camera_make` | TEXT | | Camera manufacturer (e.g., Sony, Fujifilm) |
| `camera_model`| TEXT | | Camera body model (e.g., ILCE-7RM4, X-T5) |
| `lens` | TEXT | | Lens model description (e.g., FE 24-70mm F2.8 GM II) |
| `aperture` | TEXT | | F-number (e.g., `f/2.8`, `f/8.0`) |
| `shutter_speed`| TEXT| | Exposure duration (e.g., `1/250s`, `1.6s`) |
| `iso` | INTEGER | | ISO sensitivity (e.g., 100, 3200) |
| `focal_length`| REAL | | Actual focal length in mm (e.g., 50.0) |
| `focal_length_35mm`| REAL | | 35mm equivalent focal length in mm |
| `date_taken` | DATETIME | | Timestamp when the photo was shot |
| `exposure_program` | TEXT | | e.g. Aperture Priority, Manual |
| `metering_mode` | TEXT | | e.g. Multi-segment, Spot |
| `flash` | TEXT | | Flash status (e.g. Did not fire, Fired) |
| `gps_latitude`| REAL | | Decimal latitude |
| `gps_longitude`| REAL | | Decimal longitude |
| `gps_altitude`| REAL | | GPS altitude in meters |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Database entry creation time |

#### 2. `albums`
Aggregates photographs into curated collections.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Unique album slug or UUID |
| `name` | TEXT | NOT NULL | Album name |
| `description`| TEXT | | Short album description |
| `cover_photo_id`| TEXT | REFERENCES `photos(id)` | ID of the photo representing this album |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Album creation timestamp |

#### 3. `photo_albums` (Join Table)
Supports many-to-many relationships between photos and albums.

| Column | Type | Constraints |
| :--- | :--- | :--- |
| `photo_id` | TEXT | FOREIGN KEY REFERENCES `photos(id)` ON DELETE CASCADE |
| `album_id` | TEXT | FOREIGN KEY REFERENCES `albums(id)` ON DELETE CASCADE |
| | | PRIMARY KEY (`photo_id`, `album_id`) |

#### 4. `tags`
Simple tag table for search and filtering.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | Tag slug (e.g., `landscape`, `street`) |
| `name` | TEXT | NOT NULL | Human-readable tag (e.g., `Landscape`, `Street`) |

#### 5. `photo_tags` (Join Table)
Many-to-many mapping for photo tags.

| Column | Type | Constraints |
| :--- | :--- | :--- |
| `photo_id` | TEXT | FOREIGN KEY REFERENCES `photos(id)` ON DELETE CASCADE |
| `tag_id` | TEXT | FOREIGN KEY REFERENCES `tags(id)` ON DELETE CASCADE |
| | | PRIMARY KEY (`photo_id`, `tag_id`) |

---

## 2. Compiled Static JSON Structure

The React frontend fetches a consolidated static JSON file at runtime. This file merges relationships (albums, tags) into arrays nested directly inside each photo object to avoid relational resolution overhead on the client side.

### Output JSON Format (`public/data.json`)
```json
{
  "albums": [
    {
      "id": "japan-2025",
      "name": "Japan Travel 2025",
      "description": "Street and landscape photography from Tokyo and Kyoto.",
      "coverPhotoUrl": "https://r2.nicogallery.com/japan-2025/tokyo_tower_cover.webp"
    }
  ],
  "photos": [
    {
      "id": "tokyo-tower-night",
      "title": "Tokyo Tower by Night",
      "description": "Captured from Roppongi Hills observation deck during a clear autumn evening.",
      "r2Url": "https://r2.nicogallery.com/japan-2025/tokyo_tower_cover.webp",
      "width": 6000,
      "height": 4000,
      "aspectRatio": 1.5,
      "camera": {
        "make": "Sony",
        "model": "ILCE-7RM4",
        "lens": "FE 24-70mm F2.8 GM II"
      },
      "exif": {
        "aperture": "f/4.0",
        "shutterSpeed": "1/4s",
        "iso": 400,
        "focalLength": 35.0,
        "focalLength35mm": 35.0,
        "dateTaken": "2025-10-15T19:34:21Z",
        "exposureProgram": "Manual",
        "meteringMode": "Pattern"
      },
      "location": {
        "name": "Roppongi, Tokyo, Japan",
        "latitude": 35.6605,
        "longitude": 139.7291
      },
      "albums": ["japan-2025"],
      "tags": ["tokyo", "night", "cityscape", "japan"]
    }
  ]
}
```

---

## 3. Build-Time Compilation Script (Vite/Node)
The script `scripts/compile-data.ts` will:
1. Load `data/gallery.json` (which uses a developer-friendly raw JSON format closely matching the SQLite rows).
2. Validate that all required properties exist (e.g. aspect ratio, image URLs, R2 links).
3. Generate the optimized runtime static JSON file inside the `public/` directory (e.g. minifying content, computing aspect ratios if missing).
4. Output stats on build size to confirm it is within expectations.

---

## 4. TODO: Database Management Tool
In the next phase, a database management CLI/application will be developed. It will:
- Listen to a local directory or process specific image imports.
- Read original camera files (RAW/JPEG/HEIC) and extract full EXIF using `exifreader` or equivalent.
- Automatically resize images (e.g., generate full-size WebP and lightweight WebP thumbnails).
- Upload the optimized WebP images directly to the Cloudflare R2 bucket.
- Save the metadata into the database and regenerate `data/gallery.json`.
