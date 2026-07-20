package cmd

import (
	"fmt"

	"manage/cli/pkg/database"

	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List photos and albums stored in SQLite database",
	RunE: func(cmd *cobra.Command, args []string) error {
		targetDbPath := dbPath
		if targetDbPath == "" {
			targetDbPath = database.GetDefaultDbPath()
		}

		gallery, err := database.LoadGalleryDataFromSqlite(targetDbPath)
		if err != nil {
			return fmt.Errorf("failed to load SQLite database from %s: %w", targetDbPath, err)
		}

		fmt.Printf("=== NicoGallery SQLite Database (%s) ===\n\n", targetDbPath)
		fmt.Printf("Albums (%d):\n", len(gallery.Albums))
		for _, a := range gallery.Albums {
			fmt.Printf("  • [%s] %s - %s\n", a.ID, a.Name, a.Description)
		}

		fmt.Printf("\nPhotos (%d):\n", len(gallery.Photos))
		for i, p := range gallery.Photos {
			fmt.Printf("  %d. [%s] %s (%dx%dpx)\n", i+1, p.ID, p.Title, p.Width, p.Height)
			fmt.Printf("     Camera: %s %s | EXIF: %s %s ISO%d %.0fmm\n",
				p.Camera.Make, p.Camera.Model, p.Exif.Aperture, p.Exif.ShutterSpeed, p.Exif.ISO, p.Exif.FocalLength)
			if p.Location.Name != "" {
				fmt.Printf("     Location: %s\n", p.Location.Name)
			}
			if len(p.Albums) > 0 {
				fmt.Printf("     Albums: %v\n", p.Albums)
			}
			if len(p.Tags) > 0 {
				fmt.Printf("     Tags: %v\n", p.Tags)
			}
			fmt.Println()
		}

		return nil
	},
}

func init() {
	rootCmd.AddCommand(listCmd)
}
