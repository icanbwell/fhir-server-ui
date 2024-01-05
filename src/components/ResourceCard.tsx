import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Collapse } from '@mui/material';
import ResourceItem from './ResourceItem';
import Json from './Json';
import { TResource } from '../types/resources/Resource';

type TResourceCardProps = {
  index: number;
  resource: TResource;
  expanded: Boolean;
  error?: boolean;
};

const ResourceCard = ({ index, resource, expanded, error }: TResourceCardProps) => {
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
