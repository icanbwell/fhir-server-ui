import React, { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, Collapse } from '@mui/material';
import ResourceItem from './ResourceItem';
import Json from './Json';
import { TResource } from '../types/resources/Resource';

type TResourceCardProps = {
  index: number;
  resource: TResource;
  expanded: boolean;
  expandAll: boolean;
  collapseAll: boolean;
  setExpandAll: React.Dispatch<React.SetStateAction<boolean>>;
  setCollapseAll: React.Dispatch<React.SetStateAction<boolean>>;
  error?: boolean;
};

const ResourceCard = ({ index, resource, expanded, error, expandAll, collapseAll, setExpandAll, setCollapseAll}: TResourceCardProps) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(!open);
    setExpandAll(false);
    setCollapseAll(false);
  };

  useEffect(() => {
    if (expandAll) {
        setOpen(true);
    }
    if (collapseAll) {
        setOpen(false);
    }
  }, [expandAll, collapseAll]);

  useEffect(() => {
    setOpen(expanded);
  }, [expanded]);

  return (
    <Card key={index}>
      <CardHeader
        onClick={handleOpen}
        style={{ cursor: 'pointer' }}
        title={`(${index + 1}) ${resource.resourceType}/${resource.id ?? ''}`}
        action={<Button>{open ? 'Close' : 'Open'}</Button>}
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
