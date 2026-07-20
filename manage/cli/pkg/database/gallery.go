package database

import (
	"database/sql"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	_ "modernc.org/sqlite"
)

type CameraInfo struct {
	Make  string `json:"make"`
	Model string `json:"model"`
	Lens  string `json:"lens"`
}

type ExifInfo struct {
	Aperture        string  `json:"aperture"`
	ShutterSpeed    string  `json:"shutterSpeed"`
	ISO             int     `json:"iso"`
	FocalLength     float64 `json:"focalLength"`
	FocalLength35mm float64 `json:"focalLength35mm,omitempty"`
	DateTaken       string  `json:"dateTaken"`
	ExposureProgram string  `json:"exposureProgram,omitempty"`
	MeteringMode    string  `json:"meteringMode,omitempty"`
}

type LocationInfo struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude,omitempty"`
	Longitude float64 `json:"longitude,omitempty"`
}

type Photo struct {
	ID          string       `json:"id"`
	Title       string       `json:"title"`
	Description string       `json:"description"`
	R2URL       string       `json:"r2Url"`
	Width       int          `json:"width"`
	Height      int          `json:"height"`
	AspectRatio float64      `json:"aspectRatio,omitempty"`
	Camera      CameraInfo   `json:"camera"`
	Exif        ExifInfo     `json:"exif"`
	Location    LocationInfo `json:"location"`
	Albums      []string     `json:"albums"`
	Tags        []string     `json:"tags"`
}

type Album struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Description   string `json:"description"`
	CoverPhotoID  string `json:"coverPhotoId"`
	CoverPhotoURL string `json:"coverPhotoUrl,omitempty"`
}

type GalleryData struct {
	Albums []Album `json:"albums"`
	Photos []Photo `json:"photos"`
}

func GetDefaultDbPath() string {
	cwd, err := os.Getwd()
	if err != nil {
		return "data/gallery.db"
	}

	candidate := filepath.Join(cwd, "..", "..", "data", "gallery.db")
	if _, err := os.Stat(candidate); err == nil {
		return candidate
	}

	candidateLocal := filepath.Join(cwd, "data", "gallery.db")
	if _, err := os.Stat(candidateLocal); err == nil {
		return candidateLocal
	}

	return "data/gallery.db"
}

func OpenDB(dbPath string) (*sql.DB, error) {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create db dir: %w", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	createTablesQuery := `
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
	`

	if _, err := db.Exec(createTablesQuery); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to create database tables: %w", err)
	}

	return db, nil
}

func LoadGalleryDataFromSqlite(dbPath string) (*GalleryData, error) {
	db, err := OpenDB(dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	// Load Albums
	albumRows, err := db.Query("SELECT id, name, description, cover_photo_id FROM albums")
	if err != nil {
		return nil, err
	}
	defer albumRows.Close()

	var albums []Album
	for albumRows.Next() {
		var a Album
		var desc, cover sql.NullString
		if err := albumRows.Scan(&a.ID, &a.Name, &desc, &cover); err != nil {
			return nil, err
		}
		a.Description = desc.String
		a.CoverPhotoID = cover.String
		albums = append(albums, a)
	}

	// Load Photos
	photoRows, err := db.Query(`
		SELECT id, title, description, r2_url, width, height,
		       camera_make, camera_model, camera_lens,
		       aperture, shutter_speed, iso, focal_length, focal_length_35mm,
		       date_taken, exposure_program, metering_mode,
		       location_name, latitude, longitude
		FROM photos
	`)
	if err != nil {
		return nil, err
	}
	defer photoRows.Close()

	var photos []Photo
	for photoRows.Next() {
		var p Photo
		var desc, make, model, lens, aperture, shutter, dateTaken, expProg, metMode, locName sql.NullString
		var iso sql.NullInt64
		var focal, focal35, lat, lng sql.NullFloat64

		err := photoRows.Scan(
			&p.ID, &p.Title, &desc, &p.R2URL, &p.Width, &p.Height,
			&make, &model, &lens,
			&aperture, &shutter, &iso, &focal, &focal35,
			&dateTaken, &expProg, &metMode,
			&locName, &lat, &lng,
		)
		if err != nil {
			return nil, err
		}

		p.Description = desc.String
		p.Camera = CameraInfo{Make: make.String, Model: model.String, Lens: lens.String}
		p.Exif = ExifInfo{
			Aperture:        aperture.String,
			ShutterSpeed:    shutter.String,
			ISO:             int(iso.Int64),
			FocalLength:     focal.Float64,
			FocalLength35mm: focal35.Float64,
			DateTaken:       dateTaken.String,
			ExposureProgram: expProg.String,
			MeteringMode:    metMode.String,
		}
		p.Location = LocationInfo{
			Name:      locName.String,
			Latitude:  lat.Float64,
			Longitude: lng.Float64,
		}

		// Load photo albums
		albumQuery, _ := db.Query("SELECT album_id FROM photo_albums WHERE photo_id = ?", p.ID)
		p.Albums = []string{}
		if albumQuery != nil {
			for albumQuery.Next() {
				var albumID string
				_ = albumQuery.Scan(&albumID)
				p.Albums = append(p.Albums, albumID)
			}
			albumQuery.Close()
		}

		// Load photo tags
		tagQuery, _ := db.Query("SELECT tag FROM photo_tags WHERE photo_id = ?", p.ID)
		p.Tags = []string{}
		if tagQuery != nil {
			for tagQuery.Next() {
				var tag string
				_ = tagQuery.Scan(&tag)
				p.Tags = append(p.Tags, tag)
			}
			tagQuery.Close()
		}

		photos = append(photos, p)
	}

	return &GalleryData{Albums: albums, Photos: photos}, nil
}

func SavePhotoToSqlite(dbPath string, p Photo) error {
	db, err := OpenDB(dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	insertPhotoStmt := `
    INSERT OR REPLACE INTO photos (
      id, title, description, r2_url, width, height,
      camera_make, camera_model, camera_lens,
      aperture, shutter_speed, iso, focal_length, focal_length_35mm,
      date_taken, exposure_program, metering_mode,
      location_name, latitude, longitude
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = tx.Exec(insertPhotoStmt,
		p.ID, p.Title, p.Description, p.R2URL, p.Width, p.Height,
		p.Camera.Make, p.Camera.Model, p.Camera.Lens,
		p.Exif.Aperture, p.Exif.ShutterSpeed, p.Exif.ISO, p.Exif.FocalLength, p.Exif.FocalLength35mm,
		p.Exif.DateTaken, p.Exif.ExposureProgram, p.Exif.MeteringMode,
		p.Location.Name, p.Location.Latitude, p.Location.Longitude,
	)
	if err != nil {
		return err
	}

	_, _ = tx.Exec("DELETE FROM photo_albums WHERE photo_id = ?", p.ID)
	for _, albumID := range p.Albums {
		_, _ = tx.Exec("INSERT INTO photo_albums (photo_id, album_id) VALUES (?, ?)", p.ID, albumID)
	}

	_, _ = tx.Exec("DELETE FROM photo_tags WHERE photo_id = ?", p.ID)
	for _, tag := range p.Tags {
		_, _ = tx.Exec("INSERT INTO photo_tags (photo_id, tag) VALUES (?, ?)", p.ID, tag)
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	TriggerCompilation(dbPath)
	return nil
}

func SaveAlbumToSqlite(dbPath string, a Album) error {
	db, err := OpenDB(dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec("INSERT OR REPLACE INTO albums (id, name, description, cover_photo_id) VALUES (?, ?, ?, ?)",
		a.ID, a.Name, a.Description, a.CoverPhotoID)
	if err != nil {
		return err
	}

	TriggerCompilation(dbPath)
	return nil
}

func TriggerCompilation(dbPath string) {
	rootDir := filepath.Dir(filepath.Dir(dbPath))
	scriptPath := filepath.Join(rootDir, "scripts", "compile-data.ts")

	if _, err := os.Stat(scriptPath); err == nil {
		fmt.Println("Triggering compilation script compile-data.ts...")
		cmd := exec.Command("npx", "tsx", scriptPath)
		cmd.Dir = rootDir
		output, err := cmd.CombinedOutput()
		if err != nil {
			fmt.Printf("Warning: Compilation script returned error: %v\nOutput: %s\n", err, string(output))
		} else {
			fmt.Printf("Compilation completed successfully:\n%s\n", string(output))
		}
	}
}
