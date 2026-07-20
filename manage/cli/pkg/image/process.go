package image

import (
	"bytes"
	"fmt"
	_ "image/jpeg"
	_ "image/png"
	"os"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
)

type ProcessResult struct {
	Buffer []byte
	Width  int
	Height int
}

func ProcessImage(filePath string, maxDimension int, quality int) (*ProcessResult, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open image file: %w", err)
	}
	defer file.Close()

	// Decode & auto-orient according to EXIF
	img, err := imaging.Decode(file, imaging.AutoOrientation(true))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Resize if dimensions exceed maxDimension
	if maxDimension > 0 && (width > maxDimension || height > maxDimension) {
		if width >= height {
			img = imaging.Resize(img, maxDimension, 0, imaging.Lanczos)
		} else {
			img = imaging.Resize(img, 0, maxDimension, imaging.Lanczos)
		}
		newBounds := img.Bounds()
		width = newBounds.Dx()
		height = newBounds.Dy()
	}

	// Encode to WebP
	var buf bytes.Buffer
	options := &webp.Options{
		Lossless: false,
		Quality:  float32(quality),
	}

	if err := webp.Encode(&buf, img, options); err != nil {
		return nil, fmt.Errorf("failed to encode to WebP: %w", err)
	}

	return &ProcessResult{
		Buffer: buf.Bytes(),
		Width:  width,
		Height: height,
	}, nil
}
