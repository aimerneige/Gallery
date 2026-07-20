import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  CloudUpload,
  Collections,
  Settings,
  PhotoCamera,
  CheckCircle,
  Error as ErrorIcon,
  Translate,
} from '@mui/icons-material';
import { useLanguage } from '../i18n';

interface NavbarProps {
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
  currentTab: 'upload' | 'photos' | 'albums';
  onTabChange: (tab: 'upload' | 'photos' | 'albums') => void;
  onOpenSettings: () => void;
  serverOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onToggleTheme,
  currentTab,
  onTabChange,
  onOpenSettings,
  serverOnline,
}) => {
  const { toggleLanguage, t } = useLanguage();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PhotoCamera sx={{ fontSize: 22 }} />
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            NicoGallery <Typography component="span" variant="caption" sx={{ opacity: 0.6, ml: 0.5, fontWeight: 600 }}>MANAGE</Typography>
          </Typography>

          <Chip
            size="small"
            icon={serverOnline ? <CheckCircle style={{ fontSize: 14 }} /> : <ErrorIcon style={{ fontSize: 14 }} />}
            label={serverOnline ? t('apiConnected') : t('apiOffline')}
            color={serverOnline ? 'success' : 'error'}
            variant="outlined"
            sx={{ ml: 1, height: 24, fontSize: '0.72rem' }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant={currentTab === 'upload' ? 'contained' : 'text'}
            startIcon={<CloudUpload />}
            onClick={() => onTabChange('upload')}
          >
            {t('navUpload')}
          </Button>

          <Button
            variant={currentTab === 'photos' ? 'contained' : 'text'}
            startIcon={<Collections />}
            onClick={() => onTabChange('photos')}
          >
            {t('navPhotos')}
          </Button>

          <Button
            variant={currentTab === 'albums' ? 'contained' : 'text'}
            startIcon={<Collections />}
            onClick={() => onTabChange('albums')}
          >
            {t('navAlbums')}
          </Button>

          <Tooltip title="Switch Language / 切换语言">
            <Button
              onClick={toggleLanguage}
              color="inherit"
              size="small"
              startIcon={<Translate sx={{ fontSize: 18 }} />}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 99, px: 1.8, fontWeight: 600, fontSize: '0.85rem' }}
            >
              {t('langToggle')}
            </Button>
          </Tooltip>

          <Tooltip title={t('navSettings')}>
            <IconButton onClick={onOpenSettings} color="inherit">
              <Settings />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton onClick={onToggleTheme} color="inherit">
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
