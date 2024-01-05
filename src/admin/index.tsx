import React from 'react';
import { List, ListItem, Divider, Box, Container, Typography, Link } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminIndexPage: React.FC = () => {
  document.title = 'Helix FHIR Server - Admin';

  return (
    <Container maxWidth={false}>
      <div style={{ minHeight: '92vh' }}>
        <Header />
        <Box>
            <List>
                <ListItem>
                    <Link href="/admin/searchLog">Search Log</Link>
                </ListItem>
                <Divider />
                <ListItem>
                    <Link href="/admin/personPatientLink">Person Linkage</Link>
                </ListItem>
                <Divider />
                <ListItem>
                    <Link href="/admin/patientData">Show/Delete Patient Data</Link>
                </ListItem>
                <Divider />
                <ListItem>
                    <Link href="/admin/personMatch">Run Person Matching test</Link>
                </ListItem>
                <Divider />
                <Typography sx={{ ml: 2, mt: 1 }}>
                    <Link href="/admin/indexes">Show Indexes</Link>
                </Typography>
                <Typography sx={{ ml: 2 }}>
                    <Link href="/admin/indexProblems">Show Index Problems</Link>
                </Typography>
                <Typography sx={{ ml: 2, mb: 1 }}>
                    <Link href="/admin/synchronizeIndexes">Synchronize Indexes (Clicking this will kick off the process)</Link>
                </Typography>
                <Divider />
                <Typography sx={{ ml: 2, mt: 1 }}>
                    <Link href="/admin/indexes?audit=1">Show Audit Indexes</Link>
                </Typography>
                <Typography sx={{ ml: 2 }}>
                    <Link href="/admin/indexProblems?audit=1">Show Audit Index Problems</Link>
                </Typography>
                <Typography sx={{ ml: 2, mb: 1 }}>
                    <Link href="/admin/synchronizeIndexes?audit=1">Synchronize Audit Indexes (Clicking this will kick off the process)</Link>
                </Typography>
                <Divider />
            </List>
        </Box>
      </div>
      <Footer />
    </Container>
  );
};

export default AdminIndexPage;
