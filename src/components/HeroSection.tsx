import React from 'react';
import { Box, Container, Typography, Paper, useTheme } from '@mui/material';
import { Grid } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CollectionsIcon from '@mui/icons-material/Collections';
import CameraIcon from '@mui/icons-material/Camera';
import FilterTiltShiftIcon from '@mui/icons-material/FilterTiltShift';

interface HeroSectionProps {
  stats: {
    photosCount: number;
    albumsCount: number;
    camerasCount: number;
    lensesCount: number;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const statItems = [
    { label: 'Photographs', value: stats.photosCount, icon: <PhotoCameraIcon sx={{ fontSize: 28 }} /> },
    { label: 'Collections', value: stats.albumsCount, icon: <CollectionsIcon sx={{ fontSize: 28 }} /> },
    { label: 'Camera Bodies', value: stats.camerasCount, icon: <CameraIcon sx={{ fontSize: 28 }} /> },
    { label: 'Lenses Used', value: stats.lensesCount, icon: <FilterTiltShiftIcon sx={{ fontSize: 28 }} /> },
  ];

  return (
    <Box 
      sx={{ 
        pt: { xs: 8, md: 12 }, 
        pb: { xs: 6, md: 8 },
        background: isDark 
          ? 'radial-gradient(circle at top right, rgba(255, 255, 255, 0.03) 0%, transparent 60%)'
          : 'radial-gradient(circle at top right, rgba(0, 0, 0, 0.02) 0%, transparent 60%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative blurred background shapes for visual aesthetics */}
      <Box 
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: '30vw',
          height: '30vw',
          borderRadius: '50%',
          background: isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.01)',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Typography
              variant="overline"
              sx={{
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                display: 'block',
                mb: 1.5,
              }}
            >
              PHOTOGRAPHY PORTFOLIO
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                lineHeight: 1.1,
                mb: 3,
                letterSpacing: '-0.02em',
              }}
            >
              Captured Moments &<br />
              <Typography 
                component="span" 
                variant="inherit"
                sx={{
                  background: isDark
                    ? 'linear-gradient(90deg, #ffffff 0%, #b0bec5 50%, #78909c 100%)'
                    : 'linear-gradient(90deg, #1a1a1a 0%, #455a64 50%, #37474f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                EXIF Metadata
              </Typography>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: 'text.secondary',
                maxWidth: 600,
                fontWeight: 300,
                mb: 4,
              }}
            >
              A visual log of street, landscape, and minimal photography.
              Click on any photograph to inspect full shooting parameters, camera settings, lens details, and capture location.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Grid container spacing={2}>
              {statItems.map((item, index) => (
                <Grid size={{ xs: 6 }} key={index}>
                  <Paper
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Box sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="h3"
                        sx={{
                          fontSize: { xs: '1.75rem', md: '2.25rem' },
                          fontWeight: 700,
                          lineHeight: 1,
                          mb: 0.5,
                        }}
                      >
                        {item.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.8rem' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
