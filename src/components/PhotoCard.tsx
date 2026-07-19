import React from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Chip, Stack, useTheme } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Format short date (e.g., Oct 2024)
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        // Smooth scaling of image on card hover
        '&:hover .card-media': {
          transform: 'scale(1.04)',
        },
        // Reveal or highlight details on hover
        '&:hover .exif-quick-badge': {
          opacity: 1,
          transform: 'translateY(0)',
        }
      }}
    >
      {/* Photo Container */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pt: `${(1 / photo.aspectRatio) * 100}%` }}>
        <CardMedia
          component="img"
          image={photo.r2Url}
          alt={photo.title}
          loading="lazy"
          className="card-media"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Quick EXIF Overlay (appears at top-left of image on hover) */}
        <Box
          className="exif-quick-badge"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            opacity: 0,
            transform: 'translateY(-10px)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 2,
          }}
        >
          <Chip
            size="small"
            icon={<CameraAltIcon style={{ color: '#fff', fontSize: '14px' }} />}
            label={`${photo.camera.make} ${photo.camera.model}`}
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              color: '#fff',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
          <Chip
            size="small"
            label={`${photo.exif.focalLength}mm • ${photo.exif.aperture} • ${photo.exif.shutterSpeed}`}
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.75)',
              color: '#fff',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          />
        </Box>
      </Box>

      {/* Info Content */}
      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {photo.title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, ml: 1, whiteSpace: 'nowrap' }}>
            {formatDate(photo.exif.dateTaken)}
          </Typography>
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            mb: 1.5,
            flexGrow: 1,
          }}
        >
          {photo.description}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <LocationOnIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {photo.location.name}
            </Typography>
          </Box>

          {/* Quick Info Tags */}
          <Stack direction="row" spacing={0.5} sx={{ overflow: 'hidden' }}>
            {photo.tags.slice(0, 3).map((tag) => (
              <Typography
                key={tag}
                variant="caption"
                sx={{
                  color: isDark ? 'primary.main' : 'secondary.main',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  mr: 1,
                }}
              >
                #{tag}
              </Typography>
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
