import React from 'react';
import { 
  Box, 
  TextField, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Chip, 
  Stack, 
  InputAdornment,
  Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Grid } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import type { Album } from '../types';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedAlbum: string;
  onAlbumChange: (albumId: string) => void;
  albums: Album[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedTag: string;
  onTagChange: (tag: string) => void;
  allTags: string[];
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedAlbum,
  onAlbumChange,
  albums,
  sortBy,
  onSortChange,
  selectedTag,
  onTagChange,
  allTags,
}) => {

  const handleSearchKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  };

  const handleAlbumSelect = (e: SelectChangeEvent<string>) => {
    onAlbumChange(e.target.value);
  };

  const handleSortSelect = (e: SelectChangeEvent<string>) => {
    onSortChange(e.target.value);
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Grid container spacing={3} sx={{ alignItems: 'center' }}>
        {/* Search Bar */}
        <Grid size={{ xs: 12, md: 5 }}>
          <TextField
            fullWidth
            placeholder="Search by title, story, camera, or tags..."
            value={searchQuery}
            onChange={handleSearchKey}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                }
              }
            }}
          />
        </Grid>

        {/* Album / Collection Filter */}
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <FormControl fullWidth>
            <InputLabel id="album-select-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterAltIcon fontSize="small" /> Collection
            </InputLabel>
            <Select
              labelId="album-select-label"
              value={selectedAlbum}
              label={
                <span>
                  <FilterAltIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} /> Collection
                </span>
              }
              onChange={handleAlbumSelect}
              sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All Collections</MenuItem>
              {albums.map((album) => (
                <MenuItem key={album.id} value={album.id}>
                  {album.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sorting Dropdown */}
        <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
          <FormControl fullWidth>
            <InputLabel id="sort-select-label" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SortIcon fontSize="small" /> Sort By
            </InputLabel>
            <Select
              labelId="sort-select-label"
              value={sortBy}
              label={
                <span>
                  <SortIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} /> Sort By
                </span>
              }
              onChange={handleSortSelect}
              sx={{ borderRadius: 3, bgcolor: 'background.paper' }}
            >
              <MenuItem value="date-desc">Newest First</MenuItem>
              <MenuItem value="date-asc">Oldest First</MenuItem>
              <MenuItem value="focal-desc">Focal Length (Longest)</MenuItem>
              <MenuItem value="focal-asc">Focal Length (Widest)</MenuItem>
              <MenuItem value="iso-asc">Lowest ISO</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Quick Tags Filter */}
      {allTags.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 500 }}>
            Filter by tag:
          </Typography>
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ gap: 1, flexWrap: 'wrap' }}
          >
            <Chip
              label="All Tags"
              onClick={() => onTagChange('')}
              variant={selectedTag === '' ? 'filled' : 'outlined'}
              color={selectedTag === '' ? 'primary' : 'default'}
              size="medium"
              sx={{ transition: 'all 0.2s' }}
            />
            {allTags.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                onClick={() => onTagChange(tag)}
                variant={selectedTag === tag ? 'filled' : 'outlined'}
                color={selectedTag === tag ? 'primary' : 'default'}
                size="medium"
                sx={{ 
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
};
