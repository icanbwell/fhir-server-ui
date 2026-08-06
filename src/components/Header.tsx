import React, { useContext, useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Popover } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { Link } from 'react-router';
import BwellIcon from '../dist/images/bwell.png';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { logout } from '../utils/auth.utils';

const Header = () => {
    const env = useContext(EnvContext);
    const { userDetails, setUserDetails } = useContext(UserContext);
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);

    const handlePopoverOpen = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleLogout = async () => {
        await logout(setUserDetails);
    };

    return (
        <React.Fragment>
            <AppBar position="static">
                <Toolbar>
                    <Button
                        color="inherit"
                        aria-label="home"
                        id="home"
                        component={Link}
                        to="/"
                        sx={{
                            textTransform: 'none',
                            gap: 1
                        }}
                    >
                        <img src={BwellIcon} alt="b.well Icon" style={{ height: 28 }} />
                        <Typography variant="h5" style={{ fontWeight: 500 }}>
                            FHIR Server
                        </Typography>
                    </Button>
                    <div style={{ flexGrow: 1 }} />
                    <IconButton
                        color="inherit"
                        aria-label="toggle dark mode"
                        onClick={toggleDarkMode}
                        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        sx={{ ml: 1 }}
                    >
                        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>
                    <IconButton
                        color="inherit"
                        aria-label="information"
                        id="appInfo"
                        onClick={handlePopoverOpen}
                        sx={{ ml: 1 }}
                    >
                        <InfoIcon />
                    </IconButton>
                    <Popover
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                    >
                        <Typography sx={{ p: 1, minWidth: '10rem' }}>
                            FHIR App: {env.FHIR_APP_VERSION}
                            <br />
                            FHIR Server: {env.getFhirServerVersion()}
                        </Typography>
                    </Popover>
                    {userDetails ? (
                        <Button
                            color="inherit"
                            startIcon={<LogoutIcon />}
                            id="btnLogout"
                            onClick={handleLogout}
                            sx={{ ml: 1 }}
                        >
                            Logout
                        </Button>
                    ) : (
                        <Button
                            color="inherit"
                            startIcon={<LoginIcon />}
                            component={Link}
                            to="/select-idp"
                            id="btnLogin"
                            sx={{ ml: 1 }}
                        >
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
        </React.Fragment>
    );
};

export default Header;
