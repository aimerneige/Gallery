package cmd

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"manage/cli/pkg/database"
	"manage/cli/pkg/exif"
	"manage/cli/pkg/image"
	"manage/cli/pkg/storage"

	"github.com/spf13/cobra"
)

var (
	idFlag              string
	titleFlag           string
	descriptionFlag     string
	cameraMakeFlag      string
	cameraModelFlag     string
	cameraLensFlag      string
	apertureFlag        string
	shutterSpeedFlag    string
	isoFlag             int
	focalLengthFlag     float64
	locationNameFlag    string
	latitudeFlag        float64
	longitudeFlag       float64
	albumsFlag          []string
	tagsFlag            []string
	qualityFlag         int
	maxDimensionFlag    int
	r2AccountIDFlag     string
	r2AccessKeyIDFlag   string
	r2SecretKeyFlag     string
	r2BucketFlag        string
	r2PublicURLFlag     string
	dryRunFlag          bool
)

var uploadCmd = &cobra.Command{
	Use:   "upload <image-path>",
	Short: "Upload a photo: Extract EXIF, compress to WebP, upload to Cloudflare R2, update database",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		filePath := args[0]
		if _, err := os.Stat(filePath); err != nil {
			return fmt.Errorf("image file not found: %s", filePath)
		}

		fmt.Printf("==> Processing Photo: %s\n", filePath)

		// 1. Extract EXIF
		exifData, err := exif.ExtractExif(filePath)
		if err != nil {
			fmt.Printf("Warning: EXIF extraction error (%v). Using defaults.\n", err)
		} else {
			fmt.Println("✔ Extracted EXIF Metadata:")
			fmt.Printf("  Camera: %s %s (%s)\n", exifData.Make, exifData.Model, exifData.Lens)
			fmt.Printf("  Exif: %s, %s, ISO %d, %.0fmm, Shot at: %s\n",
				exifData.Aperture, exifData.ShutterSpeed, exifData.ISO, exifData.FocalLength, exifData.DateTaken)
		}

		// Fill in metadata defaults from flags or extracted EXIF
		if cameraMakeFlag != "" {
			exifData.Make = cameraMakeFlag
		}
		if cameraModelFlag != "" {
			exifData.Model = cameraModelFlag
		}
		if cameraLensFlag != "" {
			exifData.Lens = cameraLensFlag
		}
		if apertureFlag != "" {
			exifData.Aperture = apertureFlag
		}
		if shutterSpeedFlag != "" {
			exifData.ShutterSpeed = shutterSpeedFlag
		}
		if isoFlag > 0 {
			exifData.ISO = isoFlag
		}
		if focalLengthFlag > 0 {
			exifData.FocalLength = focalLengthFlag
		}

		// Generate Photo ID
		baseName := strings.TrimSuffix(filepath.Base(filePath), filepath.Ext(filePath))
		photoID := idFlag
		if photoID == "" {
			reg := regexp.MustCompile("[^a-zA-Z0-9]+")
			photoID = strings.ToLower(reg.ReplaceAllString(baseName, "-"))
			photoID = strings.Trim(photoID, "-")
		}

		photoTitle := titleFlag
		if photoTitle == "" {
			photoTitle = strings.Title(strings.ReplaceAll(baseName, "-", " "))
		}

		// 2. Compress & Resize Image to WebP
		fmt.Printf("==> Resizing & Compressing to WebP (MaxEdge: %dpx, Quality: %d%%)...\n", maxDimensionFlag, qualityFlag)
		procResult, err := image.ProcessImage(filePath, maxDimensionFlag, qualityFlag)
		if err != nil {
			return fmt.Errorf("failed to process image: %w", err)
		}
		fmt.Printf("✔ WebP compressed successfully: %d x %d px (%d KB)\n", procResult.Width, procResult.Height, len(procResult.Buffer)/1024)

		// 3. Upload to Cloudflare R2 / Fallback
		r2Cfg := storage.Config{
			AccountID:       getEnvOrFlag(r2AccountIDFlag, "R2_ACCOUNT_ID"),
			AccessKeyID:     getEnvOrFlag(r2AccessKeyIDFlag, "R2_ACCESS_KEY_ID"),
			SecretAccessKey: getEnvOrFlag(r2SecretKeyFlag, "R2_SECRET_ACCESS_KEY"),
			BucketName:      getEnvOrFlag(r2BucketFlag, "R2_BUCKET_NAME"),
			PublicURLPrefix: getEnvOrFlag(r2PublicURLFlag, "R2_PUBLIC_URL_PREFIX"),
		}
		if r2Cfg.BucketName == "" {
			r2Cfg.BucketName = "nicogallery"
		}

		targetDbPath := dbPath
		if targetDbPath == "" {
			targetDbPath = database.GetDefaultDataPath()
		}
		rootDir := filepath.Dir(filepath.Dir(targetDbPath))

		fmt.Println("==> Uploading image asset...")
		r2Url, err := storage.UploadToR2(context.Background(), procResult.Buffer, fmt.Sprintf("%s.webp", photoID), r2Cfg, rootDir)
		if err != nil {
			return fmt.Errorf("storage upload error: %w", err)
		}
		fmt.Printf("✔ Image R2/URL: %s\n", r2Url)

		// 4. Update Database
		if dryRunFlag {
			fmt.Println("⚡ [--dry-run active] Database update skipped.")
			return nil
		}

		gallery, err := database.LoadGalleryData(targetDbPath)
		if err != nil {
			return fmt.Errorf("failed to load database: %w", err)
		}

		newPhoto := database.Photo{
			ID:          photoID,
			Title:       photoTitle,
			Description: descriptionFlag,
			R2URL:       r2Url,
			Width:       procResult.Width,
			Height:      procResult.Height,
			Camera: database.CameraInfo{
				Make:  exifData.Make,
				Model: exifData.Model,
				Lens:  exifData.Lens,
			},
			Exif: database.ExifInfo{
				Aperture:        exifData.Aperture,
				ShutterSpeed:    exifData.ShutterSpeed,
				ISO:             exifData.ISO,
				FocalLength:     exifData.FocalLength,
				FocalLength35mm: exifData.FocalLength35mm,
				DateTaken:       exifData.DateTaken,
			},
			Location: database.LocationInfo{
				Name:      locationNameFlag,
				Latitude:  latitudeFlag,
				Longitude: longitudeFlag,
			},
			Albums: albumsFlag,
			Tags:   tagsFlag,
		}

		// Insert or replace
		replaced := false
		for i, p := range gallery.Photos {
			if p.ID == photoID {
				gallery.Photos[i] = newPhoto
				replaced = true
				break
			}
		}
		if !replaced {
			gallery.Photos = append([]database.Photo{newPhoto}, gallery.Photos...)
		}

		if err := database.SaveGalleryData(targetDbPath, gallery); err != nil {
			return fmt.Errorf("failed to save gallery database: %w", err)
		}

		fmt.Printf("🎉 Successfully published photo '%s' [%s] to NicoGallery database!\n", photoTitle, photoID)
		return nil
	},
}

func getEnvOrFlag(flagVal, envVar string) string {
	if flagVal != "" {
		return flagVal
	}
	return os.Getenv(envVar)
}

func init() {
	rootCmd.AddCommand(uploadCmd)

	uploadCmd.Flags().StringVar(&idFlag, "id", "", "Custom photo ID / slug")
	uploadCmd.Flags().StringVarP(&titleFlag, "title", "t", "", "Photo title")
	uploadCmd.Flags().StringVarP(&descriptionFlag, "description", "m", "", "Photo story / description")
	uploadCmd.Flags().StringVar(&cameraMakeFlag, "camera-make", "", "Camera make override")
	uploadCmd.Flags().StringVar(&cameraModelFlag, "camera-model", "", "Camera model override")
	uploadCmd.Flags().StringVar(&cameraLensFlag, "camera-lens", "", "Lens model override")
	uploadCmd.Flags().StringVar(&apertureFlag, "aperture", "", "Aperture override (e.g. f/2.8)")
	uploadCmd.Flags().StringVar(&shutterSpeedFlag, "shutter-speed", "", "Shutter speed override (e.g. 1/125s)")
	uploadCmd.Flags().IntVar(&isoFlag, "iso", 0, "ISO sensitivity override")
	uploadCmd.Flags().Float64Var(&focalLengthFlag, "focal-length", 0, "Focal length override in mm")
	uploadCmd.Flags().StringVar(&locationNameFlag, "location-name", "", "Location description name")
	uploadCmd.Flags().Float64Var(&latitudeFlag, "latitude", 0, "GPS Latitude")
	uploadCmd.Flags().Float64Var(&longitudeFlag, "longitude", 0, "GPS Longitude")
	uploadCmd.Flags().StringSliceVar(&albumsFlag, "albums", []string{}, "Comma-separated album IDs")
	uploadCmd.Flags().StringSliceVar(&tagsFlag, "tags", []string{}, "Comma-separated tag names")
	uploadCmd.Flags().IntVar(&qualityFlag, "quality", 80, "WebP compression quality (1-100)")
	uploadCmd.Flags().IntVar(&maxDimensionFlag, "max-dimension", 1600, "Max edge dimension in pixels")
	uploadCmd.Flags().StringVar(&r2AccountIDFlag, "r2-account-id", "", "Cloudflare R2 Account ID")
	uploadCmd.Flags().StringVar(&r2AccessKeyIDFlag, "r2-access-key-id", "", "Cloudflare R2 Access Key ID")
	uploadCmd.Flags().StringVar(&r2SecretKeyFlag, "r2-secret-access-key", "", "Cloudflare R2 Secret Access Key")
	uploadCmd.Flags().StringVar(&r2BucketFlag, "r2-bucket", "", "Cloudflare R2 Bucket Name")
	uploadCmd.Flags().StringVar(&r2PublicURLFlag, "r2-public-url", "", "Cloudflare R2 Public Domain Prefix")
	uploadCmd.Flags().BoolVar(&dryRunFlag, "dry-run", false, "Validate & process without updating gallery.json")
}
