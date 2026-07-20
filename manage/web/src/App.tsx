import React, { useState, useEffect, useMemo } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { getTheme } from './theme';
import { Photo, Album, GalleryData } from './types';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { MetadataForm, MetadataFormState } from './components/MetadataForm';
import { PhotoGrid } from './components/PhotoGrid';
import { EditPhotoDialog } from './components/EditPhotoDialog';
import { AlbumManager } from './components/AlbumManager';
import { SettingsDialog, R2SettingsForm } from './components/SettingsDialog';

const initialMetadataForm: MetadataFormState = {
  id: '',
  title: '',
  description: '',
  cameraMake: '',
  cameraModel: '',
  cameraLens: '',
  aperture: 'f/2.8',
  shutterSpeed: '1/125s',
  iso: 100,
  focalLength: 35,
  dateTaken: new Date().toISOString(),
  locationName: '',
  selectedAlbums: [],
  tags: [],
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const [currentTab, setCurrentTab] = useState<'upload' | 'photos' | 'albums'>('upload');
  const [serverOnline, setServerOnline] = useState(false);

  // Gallery Data State
  const [galleryData, setGalleryData] = useState<GalleryData>({ albums: [], photos: [] });
  const [loadingData, setLoadingData] = useState(true);

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtractingExif, setIsExtractingExif] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Compression Settings
  const [quality, setQuality] = useState(80);
  const [maxDimension, setMaxDimension] = useState(1600);

  // Form State
  const [formState, setFormState] = useState<MetadataFormState>(initialMetadataForm);

  // Dialogs State
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [r2Config, setR2Config] = useState<R2SettingsForm>({
    accountId: '',
    accessKeyId: '',
    secretAccessKey: '',
    bucketName: 'nicogallery',
    publicUrlPrefix: '',
  });

  // Notification Toast State
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch initial data & check server
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setGalleryData(data);
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const cfg = await res.json();
        setR2Config(cfg);
      }
    } catch (err) {
      console.warn('Failed to load R2 config:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchConfig();
  }, []);

  const handleToggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // File selection & EXIF extraction
  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setIsExtractingExif(true);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await fetch('/api/extract-exif', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to extract EXIF data');
      }

      const data = await res.json();

      setPreviewUrl(data.previewUrl);
      setFormState((prev) => ({
        ...prev,
        id: data.suggestedId || prev.id,
        cameraMake: data.camera?.make || prev.cameraMake,
        cameraModel: data.camera?.model || prev.cameraModel,
        cameraLens: data.camera?.lens || prev.cameraLens,
        aperture: data.exif?.aperture || prev.aperture,
        shutterSpeed: data.exif?.shutterSpeed || prev.shutterSpeed,
        iso: data.exif?.iso ?? prev.iso,
        focalLength: data.exif?.focalLength ?? prev.focalLength,
        focalLength35mm: data.exif?.focalLength35mm,
        dateTaken: data.exif?.dateTaken || prev.dateTaken,
        locationName: data.location?.name || prev.locationName,
        latitude: data.location?.latitude ?? prev.latitude,
        longitude: data.location?.longitude ?? prev.longitude,
      }));

      setToast({
        open: true,
        message: 'EXIF metadata extracted successfully!',
        severity: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setToast({
        open: true,
        message: 'Failed to extract EXIF, please fill in parameters manually.',
        severity: 'error',
      });
    } finally {
      setIsExtractingExif(false);
    }
  };

  // Submit Upload Photo
  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setToast({ open: true, message: 'Please select a photo file first.', severity: 'error' });
      return;
    }
    if (!formState.id || !formState.title) {
      setToast({ open: true, message: 'Photo ID and Title are required.', severity: 'error' });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append(
        'metadata',
        JSON.stringify({
          id: formState.id,
          title: formState.title,
          description: formState.description,
          camera: {
            make: formState.cameraMake,
            model: formState.cameraModel,
            lens: formState.cameraLens,
          },
          exif: {
            aperture: formState.aperture,
            shutterSpeed: formState.shutterSpeed,
            iso: formState.iso,
            focalLength: formState.focalLength,
            focalLength35mm: formState.focalLength35mm,
            dateTaken: formState.dateTaken,
          },
          location: {
            name: formState.locationName,
            latitude: formState.latitude,
            longitude: formState.longitude,
          },
          albums: formState.selectedAlbums,
          tags: formState.tags,
          quality,
          maxDimension,
        })
      );

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Upload failed');
      }

      setToast({
        open: true,
        message: `Photo "${formState.title}" uploaded & saved to database!`,
        severity: 'success',
      });

      // Reset form & reload data
      setSelectedFile(null);
      setPreviewUrl(null);
      setFormState(initialMetadataForm);
      await fetchData();
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Album inline creation
  const handleAddNewAlbum = async (name: string) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, description: '' }),
      });
      if (res.ok) {
        setToast({ open: true, message: `Album "${name}" created!`, severity: 'success' });
        await fetchData();
        setFormState((prev) => ({
          ...prev,
          selectedAlbums: [...prev.selectedAlbums, id],
        }));
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Photo Update / Delete
  const handleSaveUpdatedPhoto = async (updatedPhoto: Photo) => {
    try {
      const res = await fetch(`/api/photos/${updatedPhoto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPhoto),
      });
      if (res.ok) {
        setToast({ open: true, message: 'Photo metadata updated!', severity: 'success' });
        setEditingPhoto(null);
        await fetchData();
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleDeletePhoto = async (id: string) => {
    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ open: true, message: 'Photo deleted.', severity: 'success' });
        await fetchData();
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Album Create / Update / Delete
  const handleCreateAlbum = async (newAlbum: { id: string; name: string; description: string; coverPhotoId: string }) => {
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlbum),
      });
      if (res.ok) {
        setToast({ open: true, message: `Album "${newAlbum.name}" created!`, severity: 'success' });
        await fetchData();
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleUpdateAlbum = async (id: string, updated: Partial<Album>) => {
    try {
      const res = await fetch(`/api/albums/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setToast({ open: true, message: 'Album updated!', severity: 'success' });
        await fetchData();
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    try {
      const res = await fetch(`/api/albums/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setToast({ open: true, message: 'Album deleted.', severity: 'success' });
        await fetchData();
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Save R2 Config
  const handleSaveConfig = async (newConfig: R2SettingsForm) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        setR2Config(newConfig);
        setToast({ open: true, message: 'R2 Settings saved.', severity: 'success' });
      }
    } catch (err: any) {
      setToast({ open: true, message: err.message, severity: 'error' });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
        <Navbar
          mode={mode}
          onToggleTheme={handleToggleTheme}
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          serverOnline={serverOnline}
        />

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {loadingData ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : currentTab === 'upload' ? (
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 5 }}>
                <UploadZone
                  onFileSelected={handleFileSelected}
                  isLoading={isExtractingExif}
                  selectedFile={selectedFile}
                  previewUrl={previewUrl}
                  quality={quality}
                  onQualityChange={setQuality}
                  maxDimension={maxDimension}
                  onMaxDimensionChange={setMaxDimension}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <MetadataForm
                  formState={formState}
                  onChange={setFormState}
                  availableAlbums={galleryData.albums}
                  onAddNewAlbum={handleAddNewAlbum}
                />

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                    onClick={handleUploadSubmit}
                    disabled={isUploading || !selectedFile}
                    sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                  >
                    {isUploading ? 'Compressing & Uploading...' : 'Publish Photo to Gallery'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          ) : currentTab === 'photos' ? (
            <PhotoGrid
              photos={galleryData.photos}
              albums={galleryData.albums}
              onEditPhoto={(photo) => setEditingPhoto(photo)}
              onDeletePhoto={handleDeletePhoto}
            />
          ) : (
            <AlbumManager
              albums={galleryData.albums}
              photos={galleryData.photos}
              onCreateAlbum={handleCreateAlbum}
              onUpdateAlbum={handleUpdateAlbum}
              onDeleteAlbum={handleDeleteAlbum}
            />
          )}
        </Container>
      </Box>

      {/* Edit Photo Dialog */}
      <EditPhotoDialog
        open={Boolean(editingPhoto)}
        photo={editingPhoto}
        albums={galleryData.albums}
        onClose={() => setEditingPhoto(null)}
        onSave={handleSaveUpdatedPhoto}
        onAddNewAlbum={handleAddNewAlbum}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveConfig={handleSaveConfig}
        initialConfig={r2Config}
      />

      {/* Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: 3, fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default App;
