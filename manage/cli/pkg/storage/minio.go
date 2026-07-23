package storage

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type MinioConfig struct {
	Endpoint        string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	PublicURLPrefix string
	Region          string
	UsePathStyle    bool
}

// MinioStorage implements the Storage interface for MinIO / S3 compatible storage.
type MinioStorage struct {
	cfg MinioConfig
}

// NewMinioStorage creates a new instance of MinioStorage.
func NewMinioStorage(cfg MinioConfig) *MinioStorage {
	if cfg.BucketName == "" {
		cfg.BucketName = "nicogallery"
	}
	if cfg.Region == "" {
		cfg.Region = "us-east-1"
	}
	return &MinioStorage{cfg: cfg}
}

// Upload uploads the buffer to MinIO and returns the public URL.
func (s *MinioStorage) Upload(ctx context.Context, buffer []byte, filename string) (string, error) {
	cfg := s.cfg
	if cfg.Endpoint == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" || cfg.BucketName == "" {
		return "", fmt.Errorf("MinIO credentials/configurations (MINIO_ENDPOINT, MINIO_ACCESS_KEY_ID, MINIO_SECRET_ACCESS_KEY, MINIO_BUCKET_NAME) are missing. Please provide them via flags or environment variables")
	}

	s3Client := s3.New(s3.Options{
		Region:           cfg.Region,
		BaseEndpoint:     aws.String(cfg.Endpoint),
		Credentials:      credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
		UsePathStyle:     cfg.UsePathStyle,
	})

	key := fmt.Sprintf("photos/%s", filename)
	contentType := "image/webp"

	_, err := s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(cfg.BucketName),
		Key:         aws.String(key),
		Body:        bytes.NewReader(buffer),
		ContentType: aws.String(contentType),
	})

	if err != nil {
		return "", fmt.Errorf("MinIO upload failed: %w", err)
	}

	if cfg.PublicURLPrefix != "" {
		prefix := strings.TrimSuffix(cfg.PublicURLPrefix, "/")
		return fmt.Sprintf("%s/%s", prefix, key), nil
	}

	endpoint := strings.TrimSuffix(cfg.Endpoint, "/")
	if cfg.UsePathStyle {
		return fmt.Sprintf("%s/%s/%s", endpoint, cfg.BucketName, key), nil
	}

	if strings.HasPrefix(endpoint, "https://") {
		clean := strings.TrimPrefix(endpoint, "https://")
		return fmt.Sprintf("https://%s.%s/%s", cfg.BucketName, clean, key), nil
	} else if strings.HasPrefix(endpoint, "http://") {
		clean := strings.TrimPrefix(endpoint, "http://")
		return fmt.Sprintf("http://%s.%s/%s", cfg.BucketName, clean, key), nil
	}

	return fmt.Sprintf("%s/%s/%s", endpoint, cfg.BucketName, key), nil
}
