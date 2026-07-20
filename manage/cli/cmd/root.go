package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	dbPath string
)

var rootCmd = &cobra.Command{
	Use:   "nicogallery-cli",
	Short: "NicoGallery Management CLI - Photo uploads, EXIF extraction & gallery data updates",
	Long:  `A fast and modern command-line management tool for NicoGallery to convert photos to WebP, extract EXIF parameters, upload to Cloudflare R2, and manage gallery.json database.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&dbPath, "db", "d", "", "Path to source gallery.json database file")
}
