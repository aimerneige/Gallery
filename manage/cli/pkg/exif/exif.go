package exif

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/rwcarlsen/goexif/exif"
)

type ExtractedData struct {
	Make            string
	Model           string
	Lens            string
	Aperture        string
	ShutterSpeed    string
	ISO             int
	FocalLength     float64
	FocalLength35mm float64
	DateTaken       string
	Latitude        float64
	Longitude       float64
	HasGPS          bool
}

func ExtractExif(filePath string) (*ExtractedData, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file for EXIF: %w", err)
	}
	defer file.Close()

	x, err := exif.Decode(file)
	data := &ExtractedData{
		Make:         "Unknown Make",
		Model:        "Unknown Model",
		Lens:         "Unknown Lens",
		Aperture:     "f/2.8",
		ShutterSpeed: "1/125s",
		ISO:          100,
		FocalLength:  35,
		DateTaken:    time.Now().Format(time.RFC3339),
	}

	if err != nil {
		// If decoding fails, return default data with current timestamp
		return data, nil
	}

	// Camera Make & Model
	if makeTag, err := x.Get(exif.Make); err == nil {
		val, _ := makeTag.StringVal()
		data.Make = strings.Trim(val, "\x00\" ")
	}

	if modelTag, err := x.Get(exif.Model); err == nil {
		val, _ := modelTag.StringVal()
		data.Model = strings.Trim(val, "\x00\" ")
	}

	if lensTag, err := x.Get(exif.LensModel); err == nil {
		val, _ := lensTag.StringVal()
		data.Lens = strings.Trim(val, "\x00\" ")
	}

	// Aperture (FNumber)
	if fnumTag, err := x.Get(exif.FNumber); err == nil {
		num, den, err := fnumTag.Rat2(0)
		if err == nil && den != 0 {
			fval := float64(num) / float64(den)
			data.Aperture = fmt.Sprintf("f/%.1f", fval)
			data.Aperture = strings.Replace(data.Aperture, ".0", "", 1)
		}
	}

	// Shutter Speed (ExposureTime)
	if expTag, err := x.Get(exif.ExposureTime); err == nil {
		num, den, err := expTag.Rat2(0)
		if err == nil {
			if num == 1 {
				data.ShutterSpeed = fmt.Sprintf("1/%ds", den)
			} else if den != 0 {
				data.ShutterSpeed = fmt.Sprintf("%.2fs", float64(num)/float64(den))
			}
		}
	}

	// ISO
	if isoTag, err := x.Get(exif.ISOSpeedRatings); err == nil {
		val, err := isoTag.Int(0)
		if err == nil {
			data.ISO = val
		}
	}

	// Focal Length
	if flTag, err := x.Get(exif.FocalLength); err == nil {
		num, den, err := flTag.Rat2(0)
		if err == nil && den != 0 {
			data.FocalLength = float64(num) / float64(den)
		}
	}

	if fl35Tag, err := x.Get(exif.FocalLengthIn35mmFilm); err == nil {
		val, err := fl35Tag.Int(0)
		if err == nil {
			data.FocalLength35mm = float64(val)
		}
	}

	// Date Taken
	if dateTag, err := x.DateTime(); err == nil {
		data.DateTaken = dateTag.Format(time.RFC3339)
	}

	// GPS Coordinates
	lat, long, err := x.LatLong()
	if err == nil {
		data.Latitude = lat
		data.Longitude = long
		data.HasGPS = true
	}

	return data, nil
}

func ParseFloatOr(val string, fallback float64) float64 {
	if val == "" {
		return fallback
	}
	parsed, err := strconv.ParseFloat(val, 64)
	if err != nil {
		return fallback
	}
	return parsed
}

func ParseIntOr(val string, fallback int) int {
	if val == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return parsed
}
