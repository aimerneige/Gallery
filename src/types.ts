export interface CameraInfo {
  make: string;
  model: string;
  lens: string;
}

export interface ExifInfo {
  aperture: string;
  shutterSpeed: string;
  iso: number;
  focalLength: number;
  focalLength35mm?: number;
  dateTaken: string;
  exposureProgram?: string;
  meteringMode?: string;
  flash?: string;
}

export interface LocationInfo {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface Photo {
  id: string;
  title: string;
  description: string;
  author?: string;
  r2Url: string;
  width: number;
  height: number;
  aspectRatio: number;
  camera: CameraInfo;
  exif: ExifInfo;
  location: LocationInfo;
  albums: string[];
  tags: string[];
}

export interface Album {
  id: string;
  name: string;
  description: string;
  coverPhotoId: string;
  coverPhotoUrl: string;
}

export interface GalleryData {
  albums: Album[];
  photos: Photo[];
}
