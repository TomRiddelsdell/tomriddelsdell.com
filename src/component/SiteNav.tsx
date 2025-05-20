import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useAuth } from '../Auth';
import { availableApps } from '../AppConfig';
import { AppAccessScope } from '../AppAccessScope';
import { User } from '../Auth';
import Dialog from '@mui/material/Dialog';
import { Authenticator } from '@aws-amplify/ui-react'
import DialogContent from '@mui/material/DialogContent';
import { Popper } from '@mui/base/Popper';
import { AuthProvider } from '../AuthContext';

export default function SiteNav() {
  const { user, signOut } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popperAnchorEl, setPopperAnchorEl] = React.useState<null | HTMLElement>(null);

  const popperOpen = Boolean(popperAnchorEl);
  const popperId = popperOpen ? 'simple-popper' : undefined;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuIconClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleSignInOutSwitch = () => {
    user ? signOut() : setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  function filteredApps(user: User|null){
    return user ? availableApps : availableApps.filter(app => app.access == AppAccessScope.public);
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: 'grey'}} >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleMenuIconClick}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={menuAnchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(menuAnchorEl)}
            onClose={handleClose}
          >
            {
              filteredApps(user).map(app => (
                <MenuItem key={app.id} onClick={handleClose}>
                  <a href={app.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                    {app.name}
                  </a>
                </MenuItem>
            ))}
          </Menu>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            tomriddelsdell.com
          </Typography>
          {user && (
            <div>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>Profile</MenuItem>
                <MenuItem onClick={handleClose}>My account</MenuItem>
              </Menu>
            </div>
          )}
          <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={user ? true : false}
                    onChange={handleSignInOutSwitch}
                    aria-label="login switch"
                  />
                }
                label={user ? 'Logout' : 'Login'}
              />
              <Popper id={popperId} open={popperOpen} anchorEl={popperAnchorEl}>
                <AuthProvider/>
              </Popper>
          </FormGroup>
        </Toolbar>
      </AppBar>
      <Dialog open={isPopupOpen} onClose={handleClosePopup}>
        <DialogContent>
          <Authenticator />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
                /*
                */