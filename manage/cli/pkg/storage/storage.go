package storage

import "context"

// Storage represents an abstract file storage interface.
type Storage interface {
	Upload(ctx context.Context, buffer []byte, filename string) (string, error)
}
