import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box } from '@mui/material';
import ResourceCard from './ResourceCard';

type TResourceListProps = {
    resources: any[];
    indexStart: number;
    resourceCardExpanded: boolean;
    expandAll: boolean;
    collapseAll: boolean;
    setExpandAll: React.Dispatch<React.SetStateAction<boolean>>;
    setCollapseAll: React.Dispatch<React.SetStateAction<boolean>>;
};

// Renders `resources` as ResourceCards inside a fixed-height scroll container, mounting DOM
// only for rows near the viewport. Row height varies (cards grow when expanded), so this uses
// dynamic measurement (`virtualizer.measureElement`) rather than a fixed estimate — each row's
// real height is measured after it renders and the virtualizer's ResizeObserver picks up
// changes when a card is expanded/collapsed.
const ResourceList = ({
    resources,
    indexStart,
    resourceCardExpanded,
    expandAll,
    collapseAll,
    setExpandAll,
    setCollapseAll,
}: TResourceListProps) => {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: resources.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 96,
        overscan: 8,
    });

    return (
        <Box ref={parentRef} sx={{ height: '75vh', overflow: 'auto', contain: 'strict' }}>
            <Box sx={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const fullResource = resources[virtualRow.index];
                    const resource = fullResource.resource || fullResource;
                    const error = resource.resourceType === 'OperationOutcome';
                    return (
                        <Box
                            key={virtualRow.key}
                            ref={virtualizer.measureElement}
                            data-index={virtualRow.index}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <ResourceCard
                                index={indexStart + virtualRow.index}
                                resource={resource}
                                expanded={resourceCardExpanded}
                                expandAll={expandAll}
                                collapseAll={collapseAll}
                                setExpandAll={setExpandAll}
                                setCollapseAll={setCollapseAll}
                                error={error}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ResourceList;
