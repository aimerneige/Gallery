import { useState, useEffect, useMemo } from 'react';
import { 
  ThemeProvider, 
  CssBaseline, 
  Container, 
  Box, 
  Typography, 
  CircularProgress,
  Paper,
  Alert
} from '@mui/material';
import Masonry from '@mui/lab/Masonry';

import { getTheme } from './theme';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SearchAndFilter } from './components/SearchAndFilter';
import { PhotoCard } from './components/PhotoCard';
import { PhotoDetailsModal } from './components/PhotoDetailsModal';
import { LanguageProvider } from './i18n';
import type { GalleryData, Photo } from './types';

function MainApp() {
  // Theme state
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode === 'light' || savedMode === 'dark') return savedMode;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  const theme = useMemo(() => getTheme(mode), [mode]);

  // Gallery state
  const [galleryData, setGalleryData] = useState<GalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // Toggle Theme
  const handleToggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme-mode', next);
      return next;
    });
  };

  // Fetch Gallery Data at startup
  useEffect(() => {
    setLoading(true);
    fetch('./data.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load gallery data: HTTP status ${res.status}`);
        }
        return res.json();
      })
      .then((data: GalleryData) => {
        setGalleryData(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Error loading gallery data:', err);
        setError(err.message || 'An unknown error occurred while loading gallery data.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Compute unique camera bodies and lenses for Hero stats
  const stats = useMemo(() => {
    if (!galleryData) {
      return { photosCount: 0, albumsCount: 0, camerasCount: 0, lensesCount: 0 };
    }

    const uniqueCameras = new Set<string>();
    const uniqueLenses = new Set<string>();

    galleryData.photos.forEach((photo) => {
      const cameraName = `${photo.camera.make} ${photo.camera.model}`.trim();
      if (cameraName) uniqueCameras.add(cameraName);
      if (photo.camera.lens) uniqueLenses.add(photo.camera.lens.trim());
    });

    return {
      photosCount: galleryData.photos.length,
      albumsCount: galleryData.albums.length,
      camerasCount: uniqueCameras.size,
      lensesCount: uniqueLenses.size,
    };
  }, [galleryData]);

  // Aggregate all unique tags from data
  const allTags = useMemo(() => {
    if (!galleryData) return [];
    const tagsMap: { [key: string]: number } = {};
    galleryData.photos.forEach((photo) => {
      photo.tags.forEach((tag) => {
        const cleaned = tag.toLowerCase().trim();
        tagsMap[cleaned] = (tagsMap[cleaned] || 0) + 1;
      });
    });

    return Object.keys(tagsMap).sort((a, b) => tagsMap[b] - tagsMap[a]);
  }, [galleryData]);

  // Filter and sort photos
  const filteredAndSortedPhotos = useMemo(() => {
    if (!galleryData) return [];

    let result = [...galleryData.photos];

    if (selectedAlbum !== 'all') {
      result = result.filter((p) => p.albums.includes(selectedAlbum));
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(query);
        const descMatch = p.description.toLowerCase().includes(query);
        const cameraMatch = `${p.camera.make} ${p.camera.model}`.toLowerCase().includes(query);
        const lensMatch = p.camera.lens.toLowerCase().includes(query);
        const locationMatch = p.location.name.toLowerCase().includes(query);
        const tagsMatch = p.tags.some((t) => t.toLowerCase().includes(query));

        return titleMatch || descMatch || cameraMatch || lensMatch || locationMatch || tagsMatch;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.exif.dateTaken).getTime() - new Date(a.exif.dateTaken).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.exif.dateTaken).getTime() - new Date(b.exif.dateTaken).getTime();
      }
      if (sortBy === 'focal-desc') {
        return b.exif.focalLength - a.exif.focalLength;
      }
      if (sortBy === 'focal-asc') {
        return a.exif.focalLength - b.exif.focalLength;
      }
      if (sortBy === 'iso-asc') {
        return a.exif.iso - b.exif.iso;
      }
      return 0;
    });

    return result;
  }, [galleryData, selectedAlbum, selectedTag, searchQuery, sortBy]);

  // Active Album details
  const activeAlbumDetails = useMemo(() => {
    if (!galleryData || selectedAlbum === 'all') return null;
    return galleryData.albums.find((a) => a.id === selectedAlbum) || null;
  }, [galleryData, selectedAlbum]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* Header */}
      <Header mode={mode} onToggleTheme={handleToggleTheme} />

      {/* Main layout */}
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Hero Section */}
        <HeroSection stats={stats} />

        <Container maxWidth="xl" sx={{ pb: 12, flexGrow: 1 }}>
          
          {/* Filtering Controls */}
          <SearchAndFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedAlbum={selectedAlbum}
            onAlbumChange={setSelectedAlbum}
            albums={galleryData?.albums || []}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            allTags={allTags}
          />

          {/* Loading Indicator */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress size={48} />
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ my: 4, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {/* Active Album Description */}
          {!loading && activeAlbumDetails && (
            <Paper 
              variant="outlined"
              sx={{ 
                p: 3, 
                mb: 4, 
                bgcolor: mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
                border: '1px dashed',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h5" sx={{ fontFamily: '"Outfit", sans-serif', fontWeight: 700, mb: 1 }}>
                Collection: {activeAlbumDetails.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeAlbumDetails.description}
              </Typography>
            </Paper>
          )}

          {/* Gallery Grid */}
          {!loading && !error && (
            <>
              {filteredAndSortedPhotos.length > 0 ? (
                <Masonry 
                  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }} 
                  spacing={3}
                  sx={{ margin: 0 }}
                >
                  {filteredAndSortedPhotos.map((photo) => (
                    <Box key={photo.id}>
                      <PhotoCard
                        photo={photo}
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    </Box>
                  ))}
                </Masonry>
              ) : (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 12, 
                    bgcolor: 'background.paper', 
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No photographs found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search query, collection filter, or tag selection.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Container>

        {/* Footer */}
        <Box 
          component="footer" 
          sx={{ 
            py: 4, 
            borderTop: '1px solid', 
            borderColor: 'divider', 
            bgcolor: 'background.paper',
            mt: 'auto'
          }}
        >
          <Container maxWidth="xl">
            <Typography variant="body2" color="text.secondary" align="center">
              &copy; {new Date().getFullYear()} Gallery. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 1 }}>
              Built with React, Vite & Material UI. Images delivered via Cloudflare R2.
            </Typography>
          </Container>
        </Box>
      </Box>

      {/* Photo Details Modal Popup */}
      <PhotoDetailsModal
        photo={selectedPhoto}
        open={Boolean(selectedPhoto)}
        onClose={() => setSelectedPhoto(null)}
        onSelectTag={setSelectedTag}
      />
    </ThemeProvider>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

export default App;
