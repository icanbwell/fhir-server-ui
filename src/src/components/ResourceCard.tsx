import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Collapse } from '@mui/material';
import { makeStyles } from '@mui/styles';
import ResourceItem from './ResourceItem';
import Json from './Json';
import { TResource } from '../types/resources/Resource';

const useStyles = makeStyles({
  header: {
    // backgroundColor: 'lightgray', // Light gray background color
    // color: 'darkslategray',
    fontSize: '1.5em', // Text size
    // add more styles as you wish
  },
});

type TResourceCardProps = {
  index: number;
  resource: TResource;
  expanded: Boolean;
  error?: boolean;
};

const ResourceCard = ({ index, resource, expanded, error }: TResourceCardProps) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(!open);
  };

  useEffect(() => {
    if (expanded) {
      setOpen(true);
    }
  }, [expanded]);

  return (
    <Card key={index}>
      <CardHeader
        title={`(${index + 1}) ${resource.resourceType}/${resource.id ?? ''}`}
        classes={{ title: classes.header }}
        action={<Button onClick={handleOpen}>{open ? 'Close' : 'Open'}</Button>}
      ></CardHeader>
      <Collapse in={open}>
        <CardContent>
          <ResourceItem
            resourceType={resource.resourceType}
            resource={resource}
          />
          <Json resource={resource} error={error} />
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default ResourceCard;
