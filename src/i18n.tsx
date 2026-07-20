import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Header
    navTitle: 'NICOGALLERY',
    tooltipThemeDark: 'Switch to Dark Mode',
    tooltipThemeLight: 'Switch to Light Mode',
    tooltipGithub: 'View Source on GitHub',
    langName: 'English',
    langToggle: '中文',

    // Hero
    heroOverline: 'PHOTOGRAPHY PORTFOLIO',
    heroTitle1: 'Captured Moments &',
    heroTitle2: 'EXIF Metadata',
    heroSubtitle:
      'A visual log of street, landscape, and minimal photography. Click on any photograph to inspect full shooting parameters, camera settings, lens details, and capture location.',
    statPhotographs: 'Photographs',
    statCollections: 'Collections',
    statCameraBodies: 'Camera Bodies',
    statLenses: 'Lenses Used',

    // Search & Filter
    searchPlaceholder: 'Search titles, story, camera, location...',
    labelCollection: 'Collection',
    labelSortBy: 'Sort By',
    allAlbums: 'All Collections',
    allTags: 'All Tags',
    filterByTag: 'Filter by tag:',
    showingPhotos: 'Showing {count} of {total} photographs',
    sortNewest: 'Newest First',
    sortOldest: 'Oldest First',
    sortFocalDesc: 'Focal Length (Longest)',
    sortFocalAsc: 'Focal Length (Widest)',
    sortIsoAsc: 'Lowest ISO',

    // Details Modal
    modalOpenOriginal: 'Open Original R2 Image',
    modalShootingParams: 'Shooting Parameters',
    modalCameraBody: 'CAMERA BODY',
    modalLens: 'LENS',
    modalFocalLength: 'FOCAL LENGTH',
    modalAperture: 'APERTURE',
    modalShutterSpeed: 'SHUTTER SPEED',
    modalIso: 'ISO',
    modalExposureMode: 'EXPOSURE MODE',
    modalFlash: 'FLASH',
    modalFlashOff: 'Did not fire',
    modalCaptureDate: 'CAPTURE DATE',
    modalTags: 'Tags',
    modalViewMap: 'View Map Location',
    close: 'Close',
  },
  zh: {
    // Header
    navTitle: 'NICO 画廊',
    tooltipThemeDark: '切换至深色模式',
    tooltipThemeLight: '切换至浅色模式',
    tooltipGithub: '在 GitHub 查看源码',
    langName: '简体中文',
    langToggle: 'EN',

    // Hero
    heroOverline: '个人摄影作品集',
    heroTitle1: '定格光影瞬间与',
    heroTitle2: 'EXIF 拍摄参数',
    heroSubtitle:
      '街头、风光与极简主义摄影的视觉记录。点击任意照片即可查看完整拍摄参数、相机镜头细节及地理位置。',
    statPhotographs: '摄影作品',
    statCollections: '专题相册',
    statCameraBodies: '相机机身',
    statLenses: '所用镜头',

    // Search & Filter
    searchPlaceholder: '搜索标题、故事、相机型号、拍摄地点...',
    labelCollection: '专题相册',
    labelSortBy: '排序方式',
    allAlbums: '全部相册',
    allTags: '全部标签',
    filterByTag: '按标签筛选：',
    showingPhotos: '共显示 {count} / {total} 张照片',
    sortNewest: '最新拍摄',
    sortOldest: '最早拍摄',
    sortFocalDesc: '长焦优先',
    sortFocalAsc: '广角优先',
    sortIsoAsc: '最低感光度',

    // Details Modal
    modalOpenOriginal: '查看原始图片',
    modalShootingParams: '拍摄参数',
    modalCameraBody: '相机机身',
    modalLens: '镜头型号',
    modalFocalLength: '焦距',
    modalAperture: '光圈',
    modalShutterSpeed: '快门速度',
    modalIso: '感光度',
    modalExposureMode: '曝光模式',
    modalFlash: '闪光灯',
    modalFlashOff: '未闪光',
    modalCaptureDate: '拍摄日期',
    modalTags: '标签',
    modalViewMap: '查看拍摄地图',
    close: '关闭',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nicogallery_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('nicogallery_lang', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'zh' : 'en'));
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let str = translations[language][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
