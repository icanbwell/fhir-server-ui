import { useContext, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BaileyChatContainer from '../components/BaileyChatContainer';
import EnvContext from '../context/EnvironmentContext';

const BaileyAIPage = () => {
    const { baileyUrl } = useContext(EnvContext);

    useEffect(() => { document.title = 'FHIR Server - Bailey'; }, []);

    return (
        <div style={{ width: '100%', padding: 0, margin: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            {/* flex: 1 + minHeight: 0 gives this box a definite height for BaileyChatPanel's own
                h-full to resolve against, so the input row stays pinned to the bottom of the
                viewport instead of the panel shrinking to its content height. */}
            <Box sx={{ p: 2, flex: 1, minHeight: 0 }}>
                {!baileyUrl ? (
                    <Typography color="error">
                        Bailey AI is not configured (missing REACT_APP_BAILEY_URL).
                    </Typography>
                ) : (
                    <BaileyChatContainer />
                )}
            </Box>
            <Footer />
        </div>
    );
};

export default BaileyAIPage;
