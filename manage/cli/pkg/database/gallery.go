package database

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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

func GetDefaultDataPath() string {
	// Find root directory relative to execution
	cwd, err := os.Getwd()
	if err != nil {
		return "data/gallery.json"
	}
	
	// Check if current directory is inside manage/cli
	candidate := filepath.Join(cwd, "..", "..", "data", "gallery.json")
	if _, err := os.Stat(candidate); err == nil {
		return candidate
	}

	candidateLocal := filepath.Join(cwd, "data", "gallery.json")
	if _, err := os.Stat(candidateLocal); err == nil {
		return candidateLocal
	}

	return "data/gallery.json"
}

func LoadGalleryData(filePath string) (*GalleryData, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return &GalleryData{Albums: []Album{}, Photos: []Photo{}}, nil
		}
		return nil, fmt.Errorf("failed to read database file: %w", err)
	}

	var gallery GalleryData
	if err := json.Unmarshal(data, &gallery); err != nil {
		return nil, fmt.Errorf("failed to parse database JSON: %w", err)
	}

	return &gallery, nil
}

func SaveGalleryData(filePath string, gallery *GalleryData) error {
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	data, err := json.MarshalIndent(gallery, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to format database JSON: %w", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write database file: %w", err)
	}

	// Trigger data compilation
	TriggerCompilation(filePath)
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
