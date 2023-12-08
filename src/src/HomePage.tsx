// HomePage.js
import { resourceDefinitions } from './utils/reactResourceDefinitions';
import React, { useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Container,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

import { makeStyles } from '@mui/styles';
import Header from './components/Header';
import Footer from './components/Footer';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const useStyles = makeStyles({
    row: {
      '&:nth-of-type(odd)': {
        backgroundColor: '#f2f2f2', // Light gray for odd rows
      },
      '&:nth-of-type(even)': {
        backgroundColor: '#ffffff', // White for even rows
      },
      cursor: 'pointer',
    },
  });

  const classes = useStyles();

  const navigate = useNavigate();

  // eslint-disable-next-line no-unused-vars
  const searchResource = (name: String) => {
    // implementation of searchResource
  };

  // eslint-disable-next-line no-unused-vars
  const openDox = (event: any, url: String) => {
    // prevent row click event
    event.stopPropagation();
    // implementation of openDox
  };

  useEffect(() => {
    document.title = 'Helix FHIR Server';
  }, []);

  // noinspection JSValidateTypes
  return (
    <Container>
      <Header resources={resourceDefinitions} />
      <TableContainer>
        <Table stickyHeader className="sticky-table">
          <TableHead>
            <TableRow>
              <TableCell>Resource</TableCell>
              <TableCell>Description</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resourceDefinitions.map((resource) => (
              <TableRow
                key={resource.name}
                onClick={() => {
                  searchResource(resource.name);
                  navigate(`/4_0_0/${resource.name}/_search`);
                }}
                className={classes.row}
              >
                <TableCell>{resource.name}</TableCell>
                <TableCell className="pe-5 position-relative">
                  {resource.description}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(event) => openDox(event, resource.url)}
                    title={`FHIR Specification for ${resource.name}`}
                  >
                    <DescriptionIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Footer />
    </Container>
  );
};

export default Home;
