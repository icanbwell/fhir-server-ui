import { useContext } from 'react';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BaileyChatPanel from '../components/BaileyChatPanel';
import EnvContext from '../context/EnvironmentContext';

const BaileyAIPage = () => {
    const { baileyUrl } = useContext(EnvContext);

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {!baileyUrl ? (
                        <Typography color="error">
                            Bailey AI is not configured (missing REACT_APP_BAILEY_URL).
                        </Typography>
                    ) : (
                        <BaileyChatPanel />
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default BaileyAIPage;
