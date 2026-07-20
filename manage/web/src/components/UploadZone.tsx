import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Stack,
  Slider,
  Grid,
} from '@mui/material';
import { CloudUpload, Image as ImageIcon, AutoAwesome } from '@mui/icons-material';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  quality: number;
  onQualityChange: (val: number) => void;
  maxDimension: number;
  onMaxDimensionChange: (val: number) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  isLoading,
  selectedFile,
  previewUrl,
  quality,
  onQualityChange,
  maxDimension,
  onMaxDimensionChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <Box>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />

      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'divider',
          borderRadius: 4,
          bgcolor: isDragOver ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        {isLoading ? (
          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} />
            <Typography variant="body1" color="text.secondary">
              Extracting EXIF metadata & generating preview...
            </Typography>
          </Box>
        ) : previewUrl ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxHeight: 280,
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: 3,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <ImageIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 / 1024 : 0).toFixed(2)} MB)
              </Typography>
            </Stack>
            <Button size="small" variant="outlined" color="primary">
              Change Image
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'action.selected',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <CloudUpload color="primary" sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Drop your photo here, or browse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supports RAW-exported JPEGs, PNGs, and WebP. Automatic EXIF metadata parsing!
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Compression & Optimization Controls */}
      <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome fontSize="small" color="primary" /> WebP Compression Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              WebP Quality: <strong>{quality}%</strong>
            </Typography>
            <Slider
              value={quality}
              onChange={(_, val) => onQualityChange(val as number)}
              min={50}
              max={100}
              step={5}
              valueLabelDisplay="auto"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Max Edge Dimension: <strong>{maxDimension}px</strong>
            </Typography>
            <Slider
              value={maxDimension}
              onChange={(_, val) => onMaxDimensionChange(val as number)}
              min={1000}
              max={4000}
              step={200}
              valueLabelDisplay="auto"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
