package cmd

import (
	"fmt"
	"strings"

	"manage/cli/pkg/database"

	"github.com/spf13/cobra"
)

var (
	albumNameFlag        string
	albumDescriptionFlag string
	albumCoverPhotoFlag  string
)

var albumCmd = &cobra.Command{
	Use:   "album",
	Short: "Album management commands",
}

var albumCreateCmd = &cobra.Command{
	Use:   "create <album-id>",
	Short: "Create a new album in the SQLite database",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		albumID := strings.ToLower(args[0])
		targetDbPath := dbPath
		if targetDbPath == "" {
			targetDbPath = database.GetDefaultDbPath()
		}

		name := albumNameFlag
		if name == "" {
			name = strings.Title(strings.ReplaceAll(albumID, "-", " "))
		}

		newAlbum := database.Album{
			ID:           albumID,
			Name:         name,
			Description:  albumDescriptionFlag,
			CoverPhotoID: albumCoverPhotoFlag,
		}

		if err := database.SaveAlbumToSqlite(targetDbPath, newAlbum); err != nil {
			return err
		}

		fmt.Printf("✔ Created album '%s' [%s] in SQLite database\n", name, albumID)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(albumCmd)
	albumCmd.AddCommand(albumCreateCmd)

	albumCreateCmd.Flags().StringVarP(&albumNameFlag, "name", "n", "", "Album display name")
	albumCreateCmd.Flags().StringVarP(&albumDescriptionFlag, "description", "m", "", "Album description")
	albumCreateCmd.Flags().StringVar(&albumCoverPhotoFlag, "cover", "", "Cover photo ID")
}
