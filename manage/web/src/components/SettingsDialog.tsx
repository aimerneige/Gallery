import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
} from '@mui/material';
import { CloudQueue } from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveConfig: (config: R2SettingsForm) => Promise<void>;
  initialConfig: R2SettingsForm;
}

export interface R2SettingsForm {
  storageType?: 'r2' | 'minio';
  accountId: string;
  minioEndpoint?: string;
  minioRegion?: string;
  minioUsePathStyle?: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrlPrefix: string;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  onSaveConfig,
  initialConfig,
}) => {
  const [form, setForm] = useState<R2SettingsForm>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(initialConfig);
  }, [initialConfig]);

  const handleChange = (field: keyof R2SettingsForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(form);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const currentStorageType = form.storageType || 'r2';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudQueue color="primary" /> Storage Server Settings
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Choose your storage provider and configure the credentials to enable uploading photos.
          </Alert>

          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, fontSize: '0.875rem' }}>
              Storage Provider
            </FormLabel>
            <RadioGroup
              row
              value={currentStorageType}
              onChange={(e) => handleChange('storageType', e.target.value as 'r2' | 'minio')}
            >
              <FormControlLabel value="r2" control={<Radio size="small" />} label="Cloudflare R2" />
              <FormControlLabel value="minio" control={<Radio size="small" />} label="MinIO / S3 Compatible" />
            </RadioGroup>
          </FormControl>

          {currentStorageType === 'r2' ? (
            <TextField
              label="Cloudflare Account ID"
              fullWidth
              size="small"
              value={form.accountId || ''}
              onChange={(e) => handleChange('accountId', e.target.value)}
              placeholder="e.g. 8f9a0b1c2d3e4f5a6b7c8d9e"
            />
          ) : (
            <Stack spacing={2}>
              <TextField
                label="MinIO / S3 Endpoint"
                fullWidth
                size="small"
                value={form.minioEndpoint || ''}
                onChange={(e) => handleChange('minioEndpoint', e.target.value)}
                placeholder="e.g. http://localhost:9000 or https://minio.example.com"
              />
              <TextField
                label="Region"
                fullWidth
                size="small"
                value={form.minioRegion || ''}
                onChange={(e) => handleChange('minioRegion', e.target.value)}
                placeholder="us-east-1"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={form.minioUsePathStyle !== false}
                    onChange={(e) => handleChange('minioUsePathStyle', e.target.checked)}
                  />
                }
                label="Use Path-Style URLs (bucket name in path)"
              />
            </Stack>
          )}

          <TextField
            label="Access Key ID"
            fullWidth
            size="small"
            value={form.accessKeyId || ''}
            onChange={(e) => handleChange('accessKeyId', e.target.value)}
          />

          <TextField
            label="Secret Access Key"
            fullWidth
            size="small"
            type="password"
            value={form.secretAccessKey || ''}
            onChange={(e) => handleChange('secretAccessKey', e.target.value)}
            placeholder={form.secretAccessKey ? '••••••••' : ''}
          />

          <TextField
            label="Bucket Name"
            fullWidth
            size="small"
            value={form.bucketName || ''}
            onChange={(e) => handleChange('bucketName', e.target.value)}
            placeholder="nicogallery"
          />

          <TextField
            label="Public URL Prefix / Custom Domain (Optional)"
            fullWidth
            size="small"
            value={form.publicUrlPrefix || ''}
            onChange={(e) => handleChange('publicUrlPrefix', e.target.value)}
            placeholder="e.g. https://cdn.example.com or https://pub-xxx.r2.dev"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Credentials'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
