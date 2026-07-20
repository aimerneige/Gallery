import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Button,
  Stack,
} from '@mui/material';
import { Add as AddIcon, CameraAlt, Explore, Description, Style } from '@mui/icons-material';
import { Album } from '../types';

export interface MetadataFormState {
  id: string;
  title: string;
  description: string;
  cameraMake: string;
  cameraModel: string;
  cameraLens: string;
  aperture: string;
  shutterSpeed: string;
  iso: number;
  focalLength: number;
  focalLength35mm?: number;
  dateTaken: string;
  exposureProgram?: string;
  meteringMode?: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  selectedAlbums: string[];
  tags: string[];
}

interface MetadataFormProps {
  formState: MetadataFormState;
  onChange: (updated: MetadataFormState) => void;
  availableAlbums: Album[];
  onAddNewAlbum: (name: string) => void;
}

export const MetadataForm: React.FC<MetadataFormProps> = ({
  formState,
  onChange,
  availableAlbums,
  onAddNewAlbum,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);

  const handleFieldChange = (field: keyof MetadataFormState, value: any) => {
    onChange({ ...formState, [field]: value });
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !formState.tags.includes(trimmed)) {
      onChange({ ...formState, tags: [...formState.tags, trimmed] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      ...formState,
      tags: formState.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleCreateAlbum = () => {
    if (newAlbumName.trim()) {
      onAddNewAlbum(newAlbumName.trim());
      setNewAlbumName('');
      setIsCreatingAlbum(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Basic Info */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description fontSize="small" color="primary" /> Photo Identification & Story
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Photo Slug / ID"
              fullWidth
              size="small"
              value={formState.id}
              onChange={(e) => handleFieldChange('id', e.target.value)}
              helperText="Unique identifier used in URL and database"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Title"
              fullWidth
              size="small"
              value={formState.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g. Alpenglow on Mount Rainier"
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Description / Story"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={formState.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe the context, story, lighting, or technical execution..."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Camera & EXIF Specs */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CameraAlt fontSize="small" color="primary" /> Camera Hardware & EXIF Parameters
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Camera Make"
              fullWidth
              size="small"
              value={formState.cameraMake}
              onChange={(e) => handleFieldChange('cameraMake', e.target.value)}
              placeholder="Sony / Fujifilm / Canon / Leica"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Camera Model"
              fullWidth
              size="small"
              value={formState.cameraModel}
              onChange={(e) => handleFieldChange('cameraModel', e.target.value)}
              placeholder="ILCE-7RM4 / X-T5"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Lens Model"
              fullWidth
              size="small"
              value={formState.cameraLens}
              onChange={(e) => handleFieldChange('cameraLens', e.target.value)}
              placeholder="FE 24-70mm F2.8 GM II"
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 2.4 }}>
            <TextField
              label="Aperture"
              fullWidth
              size="small"
              value={formState.aperture}
              onChange={(e) => handleFieldChange('aperture', e.target.value)}
              placeholder="f/2.8"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }}>
            <TextField
              label="Shutter Speed"
              fullWidth
              size="small"
              value={formState.shutterSpeed}
              onChange={(e) => handleFieldChange('shutterSpeed', e.target.value)}
              placeholder="1/125s"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }}>
            <TextField
              label="ISO"
              fullWidth
              type="number"
              size="small"
              value={formState.iso}
              onChange={(e) => handleFieldChange('iso', Number(e.target.value))}
              placeholder="100"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 2.4 }}>
            <TextField
              label="Focal Length (mm)"
              fullWidth
              type="number"
              size="small"
              value={formState.focalLength}
              onChange={(e) => handleFieldChange('focalLength', Number(e.target.value))}
              placeholder="35"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <TextField
              label="Date Taken"
              fullWidth
              size="small"
              value={formState.dateTaken}
              onChange={(e) => handleFieldChange('dateTaken', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Location */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Explore fontSize="small" color="primary" /> Location Metadata
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Location Name"
              fullWidth
              size="small"
              value={formState.locationName}
              onChange={(e) => handleFieldChange('locationName', e.target.value)}
              placeholder="e.g. Mount Rainier National Park, WA, USA"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Latitude"
              fullWidth
              type="number"
              size="small"
              value={formState.latitude ?? ''}
              onChange={(e) => handleFieldChange('latitude', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="46.8523"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Longitude"
              fullWidth
              type="number"
              size="small"
              value={formState.longitude ?? ''}
              onChange={(e) => handleFieldChange('longitude', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="-121.7603"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Albums & Tags */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Style fontSize="small" color="primary" /> Albums & Tags Categorization
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="albums-select-label">Assign to Albums</InputLabel>
              <Select
                labelId="albums-select-label"
                multiple
                value={formState.selectedAlbums}
                onChange={(e) => handleFieldChange('selectedAlbums', e.target.value)}
                input={<OutlinedInput label="Assign to Albums" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const album = availableAlbums.find((a) => a.id === value);
                      return <Chip key={value} label={album ? album.name : value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {availableAlbums.map((album) => (
                  <MenuItem key={album.id} value={album.id}>
                    {album.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!isCreatingAlbum ? (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setIsCreatingAlbum(true)}
                sx={{ mt: 1 }}
              >
                Create New Album
              </Button>
            ) : (
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="New album name"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                />
                <Button variant="contained" size="small" onClick={handleCreateAlbum}>
                  Add
                </Button>
                <Button size="small" onClick={() => setIsCreatingAlbum(false)}>
                  Cancel
                </Button>
              </Box>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                label="Add Tags"
                size="small"
                fullWidth
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="e.g. landscape, mountain, reflection"
              />
              <Button variant="outlined" size="small" onClick={handleAddTag}>
                Add
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, minHeight: 40, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              {formState.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={`#${tag}`}
                  size="small"
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
};
