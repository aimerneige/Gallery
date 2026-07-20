import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Collections } from '@mui/icons-material';
import { Album, Photo } from '../types';

interface AlbumManagerProps {
  albums: Album[];
  photos: Photo[];
  onCreateAlbum: (newAlbum: { id: string; name: string; description: string; coverPhotoId: string }) => void;
  onUpdateAlbum: (id: string, updated: Partial<Album>) => void;
  onDeleteAlbum: (id: string) => void;
}

export const AlbumManager: React.FC<AlbumManagerProps> = ({
  albums,
  photos,
  onCreateAlbum,
  onUpdateAlbum,
  onDeleteAlbum,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCoverId, setFormCoverId] = useState('');

  const handleOpenCreate = () => {
    setEditingAlbum(null);
    setFormId('');
    setFormName('');
    setFormDescription('');
    setFormCoverId('');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (album: Album) => {
    setEditingAlbum(album);
    setFormId(album.id);
    setFormName(album.name);
    setFormDescription(album.description);
    setFormCoverId(album.coverPhotoId);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formId || !formName) return;

    if (editingAlbum) {
      onUpdateAlbum(editingAlbum.id, {
        name: formName,
        description: formDescription,
        coverPhotoId: formCoverId,
      });
    } else {
      onCreateAlbum({
        id: formId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: formName,
        description: formDescription,
        coverPhotoId: formCoverId,
      });
    }
    setIsDialogOpen(false);
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Albums ({albums.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your photo collection into curated themes.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Create Album
        </Button>
      </Paper>

      <Grid container spacing={3}>
        {albums.map((album) => {
          const coverPhoto = photos.find((p) => p.id === album.coverPhotoId) || photos.find((p) => p.albums?.includes(album.id));
          const photoCount = photos.filter((p) => p.albums?.includes(album.id)).length;

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={album.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ position: 'relative', pt: '56.25%', bgcolor: 'background.default' }}>
                  {coverPhoto ? (
                    <CardMedia
                      component="img"
                      image={coverPhoto.r2Url}
                      alt={album.name}
                      sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Collections sx={{ fontSize: 48, opacity: 0.3 }} />
                    </Box>
                  )}

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
                    <Tooltip title="Edit Album">
                      <IconButton size="small" sx={{ color: '#fff' }} onClick={() => handleOpenEdit(album)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Album">
                      <IconButton
                        size="small"
                        sx={{ color: '#ff5252' }}
                        onClick={() => {
                          if (window.confirm(`Delete album "${album.name}"?`)) {
                            onDeleteAlbum(album.id);
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {album.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {album.description || 'No description provided.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Album Form Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingAlbum ? 'Edit Album' : 'Create New Album'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!editingAlbum && (
              <TextField
                label="Album Slug / ID"
                size="small"
                fullWidth
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="e.g. landscape-escapes"
                required
              />
            )}
            <TextField
              label="Album Name"
              size="small"
              fullWidth
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Landscape Escapes"
              required
            />
            <TextField
              label="Description"
              size="small"
              fullWidth
              multiline
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Cover Photo</InputLabel>
              <Select
                value={formCoverId}
                label="Cover Photo"
                onChange={(e) => setFormCoverId(e.target.value)}
              >
                <MenuItem value="">-- None --</MenuItem>
                {photos.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.title} ({p.id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
