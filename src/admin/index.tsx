import React from 'react';
import { List, ListItem, Divider, Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const adminLinks = [
  { label: 'Search Log', href: '/admin/searchLog' },
  { divider: true },
  { label: 'Person/Patient Linkage', href: '/admin/personPatientLink' },
  { label: 'Show/Delete Person/Patient Data', href: '/admin/patientData' },
  { label: 'Run Person Matching test', href: '/admin/personMatch' },
  { label: 'Run 1:N Person Matching', href: '/admin/personOneToNMatch' },
  { divider: true },
  { label: 'Show Indexes', href: '/admin/indexes' },
  { label: 'Show Index Problems', href: '/admin/indexProblems' },
  { label: 'Synchronize Indexes (Clicking this will kick off the process)', href: '/admin/synchronizeIndexes' },
  { divider: true },
  { label: 'Show Audit Indexes', href: '/admin/indexes?audit=1' },
  { label: 'Show Audit Index Problems', href: '/admin/indexProblems?audit=1' },
  { label: 'Synchronize Audit Indexes (Clicking this will kick off the process)', href: '/admin/synchronizeIndexes?audit=1' },
  { divider: true },
  { label: 'Manage Export', href: '/admin/ExportStatus' },
  { label: 'Invalidate Cache', href: '/admin/InvalidateCache' },
];

const AdminIndexPage: React.FC = () => {
    document.title = 'FHIR Server - Admin';

  return (
    <div style={{ width: '100%', padding: 0, margin: 0 }}>
      <div style={{ minHeight: '92vh' }}>
        <Header />
        <br />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            width: '100%',
            px: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Admin Dashboard
          </Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 3, mx: 3 }}>
          <List>
            {adminLinks.map((item, idx) =>
              item.divider ? (
                <Divider key={idx} sx={{ my: 2 }} />
              ) : (
                <ListItem key={item.href} disablePadding sx={{ mb: 1 }}>
                  <Link to={item.href!} style={{ width: '100%', textDecoration: 'none' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', fontWeight: 500 }}
                    >
                      {item.label}
                    </Button>
                  </Link>
                </ListItem>
              )
            )}
          </List>
        </Paper>
      </div>
      <Footer />
    </div>
  );
};

export default AdminIndexPage;
