import * as React from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Divider, { dividerClasses } from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import { Stack, useTheme } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router';
import type { RootState } from '../../redux/store';
import { useSelector } from 'react-redux';
import NotificationsDialog from '../notifications/NotificationsDialog';
import { useAuth } from '../../hooks/useAuth';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import MenuIcon from '@mui/icons-material/Menu';
import { useContext } from "react";
import { ColorModeContext } from "../../theme/ThemeContext";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import OrganizationSwitcher from '../organization/OrganizationSwitcher';

type HeaderProps = {
  onToggleSidebar: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.user.details);
  const { logout: performLogout } = useAuth();
  const firstLetter = user?.username.charAt(0).toUpperCase();

  const { mode, toggleColorMode } = useContext(ColorModeContext);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await performLogout();
    // Navigation is handled by useAuth hook
  }

  const handlePath1Click = () => {
    navigate(`/path1`);
    handleMenuClose();
  }

  const handlePath2Click = () => {
    navigate(`/path2`);
    handleMenuClose();
  }

  return (
      <AppBar
        position="fixed"
        elevation={0}
        sx={(theme) => ({
          zIndex: 2000,
          borderBottom: theme.palette.mode === "dark" ? `1px solid ${theme.palette.divider}` : "none",
        })}
      >
      <Toolbar>

        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={onToggleSidebar}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 1 }}
          onClick={() => navigate('/')}
        >
          <AssignmentRoundedIcon fontSize="small" />
          Task Management
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* Organization Switcher */}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
          <OrganizationSwitcher />
        </Box>

        <IconButton sx={{ ml: 1 }} onClick={toggleColorMode} color="inherit">
          {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        {/* Notifications button + dialog */}
        <NotificationsDialog />

        {/* User Avatar */}
        <IconButton
          disableRipple
          aria-label="account of current user"
          aria-controls="profile-menu"
          aria-haspopup="true"
          onClick={handleProfileMenuOpen}
        >
          <Avatar 
            src={user?.profilePic}
            sx={{ bgcolor: 'rgb(144, 202, 249)' }}
          >
            {firstLetter}
          </Avatar>
        </IconButton>
      </Toolbar>

      {/* Profile menu (unchanged) */}
      <Menu
        anchorEl={anchorEl}
        id="profile-menu"
        open={isMenuOpen}
        onClose={handleMenuClose}
        sx={{
          [`& .${dividerClasses.root}`]: {
            margin: '8px -8px',
          },
        }}
      >
        <Stack direction="row" sx={{ padding: 1, gap: 1 }}>
          <Avatar src={user?.profilePic} sx={{ bgcolor: theme.palette.primary.main}}>
            {firstLetter}
          </Avatar>
          <Box sx={{ mr: 'auto' }}>
            <Typography>{user?.username}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {user?.email}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        <MenuItem onClick={handlePath1Click}>Path 1</MenuItem>
        <MenuItem onClick={handlePath2Click}>Path 2</MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{
            [`& .${listItemIconClasses.root}`]: {
              ml: 'auto',
              minWidth: 0,
            },
          }}
        >
          <ListItemText>Logout</ListItemText>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}