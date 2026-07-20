import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Photo, Album } from '../types';
import { MetadataForm, MetadataFormState } from './MetadataForm';

interface EditPhotoDialogProps {
  open: boolean;
  photo: Photo | null;
  albums: Album[];
  onClose: () => void;
  onSave: (updatedPhoto: Photo) => void;
  onAddNewAlbum: (name: string) => void;
}

export const EditPhotoDialog: React.FC<EditPhotoDialogProps> = ({
  open,
  photo,
  albums,
  onClose,
  onSave,
  onAddNewAlbum,
}) => {
  const [formState, setFormState] = useState<MetadataFormState | null>(null);

  useEffect(() => {
    if (photo) {
      setFormState({
        id: photo.id,
        title: photo.title,
        description: photo.description || '',
        cameraMake: photo.camera?.make || '',
        cameraModel: photo.camera?.model || '',
        cameraLens: photo.camera?.lens || '',
        aperture: photo.exif?.aperture || '',
        shutterSpeed: photo.exif?.shutterSpeed || '',
        iso: photo.exif?.iso || 100,
        focalLength: photo.exif?.focalLength || 35,
        focalLength35mm: photo.exif?.focalLength35mm,
        dateTaken: photo.exif?.dateTaken || '',
        exposureProgram: photo.exif?.exposureProgram,
        meteringMode: photo.exif?.meteringMode,
        locationName: photo.location?.name || '',
        latitude: photo.location?.latitude,
        longitude: photo.location?.longitude,
        selectedAlbums: photo.albums || [],
        tags: photo.tags || [],
      });
    }
  }, [photo]);

  if (!photo || !formState) return null;

  const handleSave = () => {
    const updated: Photo = {
      ...photo,
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
        iso: Number(formState.iso),
        focalLength: Number(formState.focalLength),
        focalLength35mm: formState.focalLength35mm ? Number(formState.focalLength35mm) : undefined,
        dateTaken: formState.dateTaken,
        exposureProgram: formState.exposureProgram,
        meteringMode: formState.meteringMode,
      },
      location: {
        name: formState.locationName,
        latitude: formState.latitude,
        longitude: formState.longitude,
      },
      albums: formState.selectedAlbums,
      tags: formState.tags,
    };
    onSave(updated);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Edit Metadata: {photo.title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Box
            component="img"
            src={photo.r2Url}
            alt={photo.title}
            sx={{ maxHeight: 220, borderRadius: 2, objectFit: 'contain' }}
          />
        </Box>
        <MetadataForm
          formState={formState}
          onChange={setFormState}
          availableAlbums={albums}
          onAddNewAlbum={onAddNewAlbum}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
