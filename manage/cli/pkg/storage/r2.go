package storage

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	PublicURLPrefix string
}

func UploadToR2(ctx context.Context, buffer []byte, filename string, cfg Config, rootDir string) (string, error) {
	if cfg.AccountID != "" && cfg.AccessKeyID != "" && cfg.SecretAccessKey != "" && cfg.BucketName != "" {
		endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
		
		s3Client := s3.New(s3.Options{
			Region:       "auto",
			BaseEndpoint: aws.String(endpoint),
			Credentials:  credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		})

		key := fmt.Sprintf("photos/%s", filename)
		contentType := "image/webp"

		_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(cfg.BucketName),
			Key:         aws.String(key),
			Body:        bytes.NewReader(buffer),
			ContentType: aws.String(contentType),
		})

		if err == nil {
			if cfg.PublicURLPrefix != "" {
				prefix := strings.TrimSuffix(cfg.PublicURLPrefix, "/")
				return fmt.Sprintf("%s/%s", prefix, key), nil
			}
			return fmt.Sprintf("%s/%s/%s", endpoint, cfg.BucketName, key), nil
		}
		fmt.Printf("R2 upload error (%v), falling back to local storage...\n", err)
	}

	// Fallback to local storage in public/uploads/
	uploadsDir := filepath.Join(rootDir, "public", "uploads")
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create uploads dir: %w", err)
	}

	targetPath := filepath.Join(uploadsDir, filename)
	if err := os.WriteFile(targetPath, buffer, 0644); err != nil {
		return "", fmt.Errorf("failed to write local file fallback: %w", err)
	}

	fmt.Printf("Saved photo locally to: %s\n", targetPath)
	return fmt.Sprintf("./uploads/%s", filename), nil
}
