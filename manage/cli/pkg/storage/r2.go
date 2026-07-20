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

type Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey string
	BucketName      string
	PublicURLPrefix string
}

func UploadToR2(ctx context.Context, buffer []byte, filename string, cfg Config) (string, error) {
	if cfg.AccountID == "" || cfg.AccessKeyID == "" || cfg.SecretAccessKey == "" || cfg.BucketName == "" {
		return "", fmt.Errorf("Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) are missing. Please provide them via flags or environment variables")
	}

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

	if err != nil {
		return "", fmt.Errorf("Cloudflare R2 upload failed: %w", err)
	}

	if cfg.PublicURLPrefix != "" {
		prefix := strings.TrimSuffix(cfg.PublicURLPrefix, "/")
		return fmt.Sprintf("%s/%s", prefix, key), nil
	}
	return fmt.Sprintf("%s/%s/%s", endpoint, cfg.BucketName, key), nil
}
