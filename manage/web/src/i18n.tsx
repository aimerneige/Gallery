import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Navbar
    navUpload: 'Upload Photo',
    navPhotos: 'Manage Photos',
    navAlbums: 'Albums',
    navSettings: 'Storage Settings',
    apiConnected: 'API Connected',
    apiOffline: 'API Offline',
    langToggle: '中文',

    // Upload Zone
    dropTitle: 'Drop your photo here, or browse',
    dropSubtitle: 'Supports RAW-exported JPEGs, PNGs, and WebP. Automatic EXIF metadata parsing!',
    extracting: 'Extracting EXIF metadata & generating preview...',
    compressionTitle: 'WebP Compression Settings',
    webpQuality: 'WebP Quality',
    maxEdge: 'Max Edge Dimension',

    // Metadata Form
    secStory: 'Photo Identification & Story',
    slugLabel: 'Photo Slug / ID',
    slugHelper: 'Unique identifier used in URL and database',
    titleLabel: 'Title',
    descLabel: 'Description / Story',
    secCamera: 'Camera Hardware & EXIF Parameters',
    makeLabel: 'Camera Make',
    modelLabel: 'Camera Model',
    lensLabel: 'Lens Model',
    apertureLabel: 'Aperture',
    shutterLabel: 'Shutter Speed',
    isoLabel: 'ISO',
    focalLabel: 'Focal Length (mm)',
    dateLabel: 'Date Taken',
    secLocation: 'Location Metadata',
    locationNameLabel: 'Location Name',
    latLabel: 'Latitude',
    lngLabel: 'Longitude',
    secCategorization: 'Albums & Tags Categorization',
    assignAlbums: 'Assign to Albums',
    createAlbum: 'Create New Album',
    addTags: 'Add Tags',
    btnPublish: 'Publish Photo to Gallery',
    btnUploading: 'Compressing & Uploading...',
    btnCancel: 'Cancel',

    // Photo Grid
    searchManagePlaceholder: 'Search by title, description, camera, location...',
    filterTag: 'Filter Tag:',
    allTags: 'All Tags',
    showingPhotos: 'Showing {count} of {total} photos',
    editMetadata: 'Edit Metadata',
    deletePhoto: 'Delete Photo',

    // Albums
    albumsCount: 'Albums ({count})',
    albumsSubtitle: 'Organize your photo collection into curated themes.',
    btnCreateAlbum: 'Create Album',
    photosCount: '{count} Photos',
    photoCountSingle: '1 Photo',

    // Toast & Dialog
    exifSuccess: 'EXIF metadata extracted successfully!',
    exifFail: 'Failed to extract EXIF, please fill in parameters manually.',
    photoPublished: 'Photo "{title}" uploaded & saved to database!',
    photoUpdated: 'Photo metadata updated!',
    photoDeleted: 'Photo deleted.',
    albumCreated: 'Album "{name}" created!',
    albumUpdated: 'Album updated!',
    albumDeleted: 'Album deleted.',
    settingsSaved: 'R2 Settings saved.',
  },
  zh: {
    // Navbar
    navUpload: '上传照片',
    navPhotos: '照片管理',
    navAlbums: '相册管理',
    navSettings: '存储设置',
    apiConnected: 'API 已连接',
    apiOffline: 'API 离线',
    langToggle: 'EN',

    // Upload Zone
    dropTitle: '拖拽照片至此处，或点击浏览上传',
    dropSubtitle: '支持 JPEG、PNG、WebP 格式照片，系统自动解析 EXIF 元数据！',
    extracting: '正在解析 EXIF 元数据并生成 WebP 预览...',
    compressionTitle: 'WebP 压缩与优化设置',
    webpQuality: 'WebP 输出质量',
    maxEdge: '最大边长像素',

    // Metadata Form
    secStory: '照片标识与故事描述',
    slugLabel: '照片 Slug / ID',
    slugHelper: '作为数据库及 URL 唯一标识符',
    titleLabel: '照片标题',
    descLabel: '描述 / 创作故事',
    secCamera: '相机硬件与 EXIF 拍摄参数',
    makeLabel: '相机品牌',
    modelLabel: '相机型号',
    lensLabel: '镜头型号',
    apertureLabel: '光圈',
    shutterLabel: '快门速度',
    isoLabel: '感光度 (ISO)',
    focalLabel: '焦距 (mm)',
    dateLabel: '拍摄时间',
    secLocation: '地理位置元数据',
    locationNameLabel: '地点名称',
    latLabel: '纬度',
    lngLabel: '经度',
    secCategorization: '相册与标签分类',
    assignAlbums: '分配至相册',
    createAlbum: '新建相册',
    addTags: '添加标签',
    btnPublish: '发布照片到画廊',
    btnUploading: '正在压缩并上传...',
    btnCancel: '取消',

    // Photo Grid
    searchManagePlaceholder: '搜索标题、描述、相机型号、地点...',
    filterTag: '筛选标签：',
    allTags: '全部标签',
    showingPhotos: '显示 {count} / {total} 张照片',
    editMetadata: '编辑元数据',
    deletePhoto: '删除照片',

    // Albums
    albumsCount: '专题相册 ({count})',
    albumsSubtitle: '将摄影作品整理归类为不同的主题相册。',
    btnCreateAlbum: '创建相册',
    photosCount: '{count} 张照片',
    photoCountSingle: '1 张照片',

    // Toast & Dialog
    exifSuccess: '已成功提取 EXIF 元数据！',
    exifFail: 'EXIF 提取失败，请手动填写拍摄参数。',
    photoPublished: '照片 "{title}" 已发布并存入 SQLite 数据库！',
    photoUpdated: '照片元数据已更新！',
    photoDeleted: '照片已删除。',
    albumCreated: '相册 "{name}" 已创建！',
    albumUpdated: '相册已更新！',
    albumDeleted: '相册已删除。',
    settingsSaved: 'R2 存储设置已保存。',
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
    const saved = localStorage.getItem('manage_lang');
    if (saved === 'zh' || saved === 'en') return saved;
    return navigator.language.startsWith('zh') ? 'zh' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('manage_lang', language);
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
