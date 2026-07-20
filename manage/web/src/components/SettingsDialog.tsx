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
} from '@mui/material';
import { CloudQueue } from '@mui/icons-material';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveConfig: (config: R2SettingsForm) => Promise<void>;
  initialConfig: R2SettingsForm;
}

export interface R2SettingsForm {
  accountId: string;
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

  const handleChange = (field: keyof R2SettingsForm, value: string) => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudQueue color="primary" /> Cloudflare R2 Storage Settings
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            If Cloudflare R2 credentials are left empty, the backend will automatically operate in <strong>Local Fallback Mode</strong> and save WebP images into `public/uploads/`.
          </Alert>

          <TextField
            label="Cloudflare Account ID"
            fullWidth
            size="small"
            value={form.accountId}
            onChange={(e) => handleChange('accountId', e.target.value)}
            placeholder="e.g. 8f9a0b1c2d3e4f5a6b7c8d9e"
          />

          <TextField
            label="R2 Access Key ID"
            fullWidth
            size="small"
            value={form.accessKeyId}
            onChange={(e) => handleChange('accessKeyId', e.target.value)}
          />

          <TextField
            label="R2 Secret Access Key"
            fullWidth
            size="small"
            type="password"
            value={form.secretAccessKey}
            onChange={(e) => handleChange('secretAccessKey', e.target.value)}
          />

          <TextField
            label="R2 Bucket Name"
            fullWidth
            size="small"
            value={form.bucketName}
            onChange={(e) => handleChange('bucketName', e.target.value)}
            placeholder="nicogallery"
          />

          <TextField
            label="Public URL Prefix / Custom Domain"
            fullWidth
            size="small"
            value={form.publicUrlPrefix}
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
