export interface LocalizedString {
  en?: string;
  zh?: string;
}

export interface SiteConfig {
  site: {
    title: string | LocalizedString;
    description: string;
    logoIcon: 'camera' | 'aperture' | 'collections' | 'photo' | 'none';
    githubUrl?: string;
    showLanguageToggle: boolean;
    showThemeToggle: boolean;
  };
  hero: {
    showHero: boolean;
    overline: string | LocalizedString;
    titleLine1: string | LocalizedString;
    titleLine2: string | LocalizedString;
    subtitle: string | LocalizedString;
    showStats: boolean;
  };
  theme: {
    defaultMode: 'dark' | 'light' | 'system';
  };
  gallery: {
    defaultSortBy: string;
  };
  footer: {
    showFooter: boolean;
    copyright: string;
    caption: string;
  };
}

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
  config?: SiteConfig;
  albums: Album[];
  photos: Photo[];
}

