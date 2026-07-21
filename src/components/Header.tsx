import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Container, Box, Tooltip, Button } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FilterTiltShiftIcon from '@mui/icons-material/FilterTiltShift';
import CollectionsIcon from '@mui/icons-material/Collections';
import PhotoIcon from '@mui/icons-material/Photo';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import GitHubIcon from '@mui/icons-material/GitHub';
import TranslateIcon from '@mui/icons-material/Translate';
import { useLanguage, getLocalizedText } from '../i18n';
import type { SiteConfig } from '../types';

interface HeaderProps {
  mode: 'light' | 'dark';
  onToggleTheme: () => void;
  config?: SiteConfig['site'];
}

export const Header: React.FC<HeaderProps> = ({ mode, onToggleTheme, config }) => {
  const { language, toggleLanguage, t } = useLanguage();

  const titleText = config?.title
    ? getLocalizedText(config.title, language, t('navTitle'))
    : t('navTitle');

  const renderLogoIcon = () => {
    const iconType = config?.logoIcon || 'camera';
    if (iconType === 'none') return null;

    const iconStyle = {
      fontSize: 32,
      color: mode === 'dark' ? '#ffffff' : '#1a1a1a',
      filter: 'drop-shadow(0 2px 8px rgba(255, 255, 255, 0.15))',
    };

    switch (iconType) {
      case 'aperture':
        return <FilterTiltShiftIcon sx={iconStyle} />;
      case 'collections':
        return <CollectionsIcon sx={iconStyle} />;
      case 'photo':
        return <PhotoIcon sx={iconStyle} />;
      case 'camera':
      default:
        return <CameraAltIcon sx={iconStyle} />;
    }
  };

  const showLangToggle = config?.showLanguageToggle ?? true;
  const showThemeToggle = config?.showThemeToggle ?? true;
  const githubUrl = config?.githubUrl;

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', height: 72 }}>
          {/* Logo / Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {renderLogoIcon()}
            <Typography
              variant="h5"
              noWrap
              component="a"
              href="#"
              sx={{
                mr: 2,
                fontFamily: '"Outfit", sans-serif',
                fontWeight: 800,
                letterSpacing: '.05em',
                color: 'inherit',
                textDecoration: 'none',
                background: mode === 'dark' 
                  ? 'linear-gradient(45deg, #ffffff 30%, #a1a1a1 90%)' 
                  : 'linear-gradient(45deg, #1a1a1a 30%, #555555 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {titleText}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showLangToggle && (
              <Tooltip title="Switch Language / 切换语言">
                <Button
                  onClick={toggleLanguage}
                  color="inherit"
                  size="small"
                  startIcon={<TranslateIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 99,
                    px: 1.8,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {t('langToggle')}
                </Button>
              </Tooltip>
            )}

            {showThemeToggle && (
              <Tooltip title={mode === 'dark' ? t('tooltipThemeLight') : t('tooltipThemeDark')}>
                <IconButton onClick={onToggleTheme} color="inherit" sx={{ border: '1px solid', borderColor: 'divider' }}>
                  {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
            )}
            
            {githubUrl && (
              <Tooltip title={t('tooltipGithub')}>
                <IconButton 
                  component="a" 
                  href={githubUrl} 
                  target="_blank" 
                  color="inherit" 
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  <GitHubIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

