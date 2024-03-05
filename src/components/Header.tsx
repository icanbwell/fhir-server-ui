import React, { useContext, useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Button, Popover } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link } from 'react-router-dom';
import BwellIcon from '../dist/images/bwell.png';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { removeLocalData } from '../utils/localData.utils';

const Header = () => {
    const env = useContext(EnvContext);
    const { userDetails } = useContext(UserContext);
    const [anchorEl, setAnchorEl] = useState(null);

    const handlePopoverOpen = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleLogout = () => {
        const query = new URLSearchParams();
        query.set('client_id', env.AUTH_CODE_FLOW_CLIENT_ID);
        query.set('logout_uri', window.location.origin);

        // signout user locally
        removeLocalData('jwt');
        // signout user from cognito
        window.location.replace(`${env.AUTH_CODE_FLOW_URL}/logout?${query.toString()}`);
    };

    return (
        <React.Fragment>
            <AppBar position="static">
                <Toolbar>
                    <IconButton color="inherit" aria-label="home" id="home" component={Link} to="/">
                        <img src={BwellIcon} alt="b.well Icon" style={{ height: 28 }} />
                    </IconButton>

                    <Typography variant="h5" style={{ flexGrow: 1, fontWeight: 500 }}>
                        FHIR Server
                    </Typography>
                    <IconButton
                        color="inherit"
                        aria-label="information"
                        id="appInfo"
                        onMouseEnter={handlePopoverOpen}
                    >
                        <InfoIcon/>
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
                            FHIR App: {env.FHIR_APP_VERSION}<br/>
                            FHIR Server: {env.getFhirServerVersion()}
                        </Typography>
                    </Popover>
                    {userDetails && (
                        <Button
                            color="inherit"
                            startIcon={<LogoutIcon />}
                            id="btnLogout"
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
        </React.Fragment>
    );
};

export default Header;
