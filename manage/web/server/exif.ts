import ExifReader from 'exifreader';

export interface ExtractedExif {
  width?: number;
  height?: number;
  camera: {
    make: string;
    model: string;
    lens: string;
  };
  exif: {
    aperture: string;
    shutterSpeed: string;
    iso: number;
    focalLength: number;
    focalLength35mm?: number;
    dateTaken: string;
    exposureProgram?: string;
    meteringMode?: string;
  };
  location: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
}

export async function parseExif(buffer: Buffer): Promise<ExtractedExif> {
  let tags: Record<string, any> = {};
  try {
    tags = ExifReader.load(buffer, { expanded: true });
  } catch (err) {
    console.warn('ExifReader failed or no EXIF data:', err);
  }

  const exifTags = tags.exif || {};
  const gpsTags = tags.gps || {};
  const fileTags = tags.file || {};

  // Extract camera make and model
  const make = exifTags.Make?.description || tags.Make?.description || 'Unknown Make';
  const model = exifTags.Model?.description || tags.Model?.description || 'Unknown Model';
  const lens = exifTags.LensModel?.description || exifTags.Lens?.description || 'Unknown Lens';

  // Aperture: FNumber, e.g. "f/2.8"
  let aperture = 'f/2.8';
  if (exifTags.FNumber) {
    const fval = exifTags.FNumber.value ? (exifTags.FNumber.value[0] / exifTags.FNumber.value[1]) : parseFloat(exifTags.FNumber.description);
    if (!isNaN(fval)) {
      aperture = `f/${fval.toFixed(1).replace(/\.0$/, '')}`;
    }
  }

  // Shutter Speed: ExposureTime
  let shutterSpeed = '1/125s';
  if (exifTags.ExposureTime) {
    if (exifTags.ExposureTime.description) {
      shutterSpeed = exifTags.ExposureTime.description;
      if (!shutterSpeed.endsWith('s')) shutterSpeed += 's';
    }
  }

  // ISO
  let iso = 100;
  if (exifTags.ISOSpeedRatings) {
    const isoVal = parseInt(exifTags.ISOSpeedRatings.description || exifTags.ISOSpeedRatings.value, 10);
    if (!isNaN(isoVal)) iso = isoVal;
  } else if (exifTags.PhotographicSensitivity) {
    const isoVal = parseInt(exifTags.PhotographicSensitivity.description || exifTags.PhotographicSensitivity.value, 10);
    if (!isNaN(isoVal)) iso = isoVal;
  }

  // Focal Length
  let focalLength = 35;
  if (exifTags.FocalLength) {
    const flVal = parseFloat(exifTags.FocalLength.description);
    if (!isNaN(flVal)) focalLength = Math.round(flVal);
  }

  let focalLength35mm: number | undefined = undefined;
  if (exifTags.FocalLengthIn35mmFilm) {
    const fl35 = parseFloat(exifTags.FocalLengthIn35mmFilm.description);
    if (!isNaN(fl35)) focalLength35mm = Math.round(fl35);
  }

  // Date Taken
  let dateTaken = new Date().toISOString();
  if (exifTags.DateTimeOriginal?.description) {
    const dateStr = exifTags.DateTimeOriginal.description;
    const parts = dateStr.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    if (parts) {
      const parsedDate = new Date(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5], +parts[6]));
      if (!isNaN(parsedDate.getTime())) {
        dateTaken = parsedDate.toISOString();
      }
    }
  }

  // Exposure Program & Metering Mode
  const exposureProgram = exifTags.ExposureProgram?.description || undefined;
  const meteringMode = exifTags.MeteringMode?.description || undefined;

  // GPS Location
  let latitude: number | undefined = undefined;
  let longitude: number | undefined = undefined;
  if (gpsTags.Latitude !== undefined && gpsTags.Longitude !== undefined) {
    const latNum = typeof gpsTags.Latitude === 'number' ? gpsTags.Latitude : parseFloat(gpsTags.Latitude);
    const lngNum = typeof gpsTags.Longitude === 'number' ? gpsTags.Longitude : parseFloat(gpsTags.Longitude);
    if (!isNaN(latNum)) latitude = latNum;
    if (!isNaN(lngNum)) longitude = lngNum;
  }

  // Image Dimensions
  let width = fileTags['Image Width']?.value || fileTags['ImageWidth']?.value || exifTags.PixelXDimension?.value;
  let height = fileTags['Image Height']?.value || fileTags['ImageHeight']?.value || exifTags.PixelYDimension?.value;

  return {
    width: typeof width === 'number' ? width : undefined,
    height: typeof height === 'number' ? height : undefined,
    camera: {
      make,
      model,
      lens,
    },
    exif: {
      aperture,
      shutterSpeed,
      iso,
      focalLength,
      focalLength35mm,
      dateTaken,
      exposureProgram,
      meteringMode,
    },
    location: {
      name: '',
      latitude,
      longitude,
    },
  };
}
