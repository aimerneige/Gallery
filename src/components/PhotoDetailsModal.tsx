import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
  Paper,
  Chip,
  Stack,
  Tooltip,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import { Grid } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FilterTiltShiftIcon from '@mui/icons-material/FilterTiltShift';
import SpeedIcon from '@mui/icons-material/Speed';
import GrainIcon from '@mui/icons-material/Grain';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SettingsIcon from '@mui/icons-material/Settings';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import MapIcon from '@mui/icons-material/Map';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';

import type { Photo } from '../types';
import { useLanguage } from '../i18n';

interface PhotoDetailsModalProps {
  photo: Photo | null;
  open: boolean;
  onClose: () => void;
  onSelectTag: (tag: string) => void;
}

export const PhotoDetailsModal: React.FC<PhotoDetailsModalProps> = ({
  photo,
  open,
  onClose,
  onSelectTag,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';
  const { language, t } = useLanguage();

  if (!photo) return null;

  // Format date taken
  const formatFullDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Generate Google Maps URL
  const getMapUrl = () => {
    if (photo.location.latitude && photo.location.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${photo.location.latitude},${photo.location.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(photo.location.name)}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      scroll="body"
      slotProps={{
        paper: {
          sx: {
            m: { xs: 0, md: 4 },
            maxHeight: { xs: '100%', md: 'calc(100% - 64px)' },
            overflow: 'hidden',
          }
        }
      }}
    >
      {/* Close button */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(4px)',
          color: 'text.primary',
          zIndex: 10,
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          }
        }}
      >
        <CloseIcon />
      </IconButton>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        <Grid container sx={{ height: { md: '80vh', lg: '85vh' }, minHeight: { md: 600 } }}>
          
          {/* Left panel: Image display */}
          <Grid
            size={{ xs: 12, md: 7 }}
            sx={{
              bgcolor: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              height: { xs: '50vh', md: '100%' },
              minHeight: { xs: 300, md: 'auto' },
            }}
          >
            <Box
              component="img"
              src={photo.r2Url}
              alt={photo.title}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                maxHeight: '100%',
              }}
            />
            
            {/* View raw image button */}
            <Tooltip title={t('modalOpenOriginal')}>
              <IconButton
                component="a"
                href={photo.r2Url}
                target="_blank"
                sx={{
                  position: 'absolute',
                  left: 16,
                  bottom: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                  }
                }}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>

          {/* Right panel: Content and Metadata */}
          <Grid
            size={{ xs: 12, md: 5 }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 'auto', md: '100%' },
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                overflowY: 'auto',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 3.5,
              }}
            >
              {/* Photo Title & Story */}
              <Box>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{ 
                    fontFamily: '"Outfit", sans-serif',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    fontSize: { xs: '1.75rem', md: '2.25rem' }
                  }}
                >
                  {photo.title}
                </Typography>

                {photo.author && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                    <PersonIcon color="primary" sx={{ fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {t('byAuthor', { author: photo.author })}
                    </Typography>
                  </Box>
                )}
                
                {/* Location Badge */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                  <LocationOnIcon color="error" sx={{ fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {photo.location.name}
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 300 }}>
                  {photo.description}
                </Typography>
              </Box>

              <Divider />

              {/* EXIF Metadata Dashboard */}
              <Box>
                <Typography 
                  variant="subtitle1" 
                  gutterBottom 
                  sx={{ 
                    fontFamily: '"Outfit", sans-serif', 
                    fontWeight: 700, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1 
                  }}
                >
                  <InfoIcon fontSize="small" /> {t('modalShootingParams')}
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Camera Body */}
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CameraAltIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalCameraBody')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{photo.camera.make} {photo.camera.model}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Lens */}
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FilterTiltShiftIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalLens')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{photo.camera.lens}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Exposure Settings Grid */}
                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CenterFocusStrongIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalFocalLength')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {photo.exif.focalLength}mm
                          {photo.exif.focalLength35mm && photo.exif.focalLength35mm !== photo.exif.focalLength && (
                            <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                              ({photo.exif.focalLength35mm}mm eq.)
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 700, color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, fontFamily: '"Outfit", sans-serif' }}>ƒ</Typography>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalAperture')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{photo.exif.aperture}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <SpeedIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalShutterSpeed')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{photo.exif.shutterSpeed}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <GrainIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalIso')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{photo.exif.iso}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Exposure Program / Flash / Date Details */}
                  {photo.exif.exposureProgram && (
                    <Grid size={{ xs: 6 }}>
                      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <SettingsIcon color="action" sx={{ fontSize: 20 }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalExposureMode')}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{photo.exif.exposureProgram}</Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  )}

                  <Grid size={{ xs: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <FlashOnIcon color="action" sx={{ fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalFlash')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{photo.exif.flash || t('modalFlashOff')}</Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Date Taken */}
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarTodayIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>{t('modalCaptureDate')}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatFullDate(photo.exif.dateTaken)}</Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Tags & Action Buttons */}
              <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
                    {t('modalTags')}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ gap: 1, flexWrap: 'wrap' }}>
                    {photo.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={`#${tag}`}
                        size="small"
                        onClick={() => {
                          onSelectTag(tag);
                          onClose();
                        }}
                        sx={{ 
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: 'primary.light',
                            color: 'primary.contrastText',
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<MapIcon />}
                    component="a"
                    href={getMapUrl()}
                    target="_blank"
                    sx={{
                      py: 1.2,
                    }}
                  >
                    {t('modalViewMap')}
                  </Button>
                </Box>
              </Box>

            </Box>
          </Grid>

        </Grid>
      </DialogContent>
    </Dialog>
  );
};
