import { useSearchParams } from 'react-router';
import { Box, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SchedulingConsoleContent from '../components/SchedulingConsoleContent';

const SchedulingConsolePage = () => {
    const [searchParams] = useSearchParams();
    const personId = searchParams.get('personId') || undefined;

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    {personId ? (
                        <SchedulingConsoleContent key={personId} personId={personId} />
                    ) : (
                        <Typography color="text.secondary">
                            Open this page from a Person&apos;s resource card (&quot;Test
                            Scheduling&quot; link) to test scheduling for that person.
                        </Typography>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default SchedulingConsolePage;
