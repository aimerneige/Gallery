import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Tooltip,
  Stack,
} from '@mui/material';
import { Search, Delete, Edit, CameraAlt, Explore } from '@mui/icons-material';
import { Photo, Album } from '../types';

interface PhotoGridProps {
  photos: Photo[];
  albums: Album[];
  onEditPhoto: (photo: Photo) => void;
  onDeletePhoto: (id: string) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  albums,
  onEditPhoto,
  onDeletePhoto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = Array.from(new Set(photos.flatMap((p) => p.tags || [])));

  const filteredPhotos = photos.filter((photo) => {
    const matchesSearch =
      photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.camera?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      photo.location?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = selectedTag ? photo.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by title, description, camera, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 600 }}>
                Filter Tag:
              </Typography>
              {selectedTag && (
                <Chip
                  label="All Tags"
                  size="small"
                  onClick={() => setSelectedTag(null)}
                  color="default"
                />
              )}
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  color={selectedTag === tag ? 'primary' : 'default'}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="subtitle2" color="text.secondary">
        Showing {filteredPhotos.length} of {photos.length} photos
      </Typography>

      <Grid container spacing={3}>
        {filteredPhotos.map((photo) => {
          const photoAlbums = albums.filter((a) => photo.albums?.includes(a.id));
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={photo.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', pt: '60%', bgcolor: 'background.default' }}>
                  <CardMedia
                    component="img"
                    image={photo.r2Url}
                    alt={photo.title}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      display: 'flex',
                      gap: 0.5,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: 99,
                      p: 0.5,
                    }}
                  >
                    <Tooltip title="Edit Metadata">
                      <IconButton size="small" sx={{ color: '#fff' }} onClick={() => onEditPhoto(photo)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Photo">
                      <IconButton
                        size="small"
                        sx={{ color: '#ff5252' }}
                        onClick={() => {
                          if (window.confirm(`Delete photo "${photo.title}"?`)) {
                            onDeletePhoto(photo.id);
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 1 }}>
                    {photo.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {photo.description || 'No description provided.'}
                  </Typography>

                  <Stack spacing={0.8} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
                      <CameraAlt sx={{ fontSize: 16 }} />
                      <Typography variant="caption" noWrap>
                        {photo.camera?.make} {photo.camera?.model} • {photo.exif?.aperture} {photo.exif?.shutterSpeed} ISO{photo.exif?.iso}
                      </Typography>
                    </Box>
                    {photo.location?.name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.8rem' }}>
                        <Explore sx={{ fontSize: 16 }} />
                        <Typography variant="caption" noWrap>
                          {photo.location.name}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {photoAlbums.map((album) => (
                      <Chip key={album.id} label={album.name} size="small" variant="outlined" color="primary" />
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {photo.tags?.map((tag) => (
                      <Chip key={tag} label={`#${tag}`} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
};
