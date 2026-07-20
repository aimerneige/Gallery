package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the CLI version",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("nicogallery-cli v1.0.0 (Go version)")
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
