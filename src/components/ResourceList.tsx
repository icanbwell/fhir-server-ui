import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// Renders `resources` as ResourceCards inside a scroll container, mounting DOM only for rows
// near the viewport. Row height varies (cards grow when expanded), so this uses dynamic
// measurement (`virtualizer.measureElement`) rather than a fixed estimate — each row's real
// height is measured after it renders and the virtualizer's ResizeObserver picks up changes when
// a card is expanded/collapsed.
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

    // Open/closed state is lifted up here (keyed by each resource's position in `resources`)
    // rather than owned by each ResourceCard, because the virtualizer unmounts/remounts
    // ResourceCard instances as rows scroll out of and back into its rendered window — a card's
    // own local `open` state can't survive that. Keeping the set of open indices here means a
    // remounted card just re-reads whatever this component already knows about it.
    const [openIndices, setOpenIndices] = useState<Set<number>>(
        () => new Set(resourceCardExpanded ? resources.map((_, i) => i) : [])
    );

    // "Expand All" — applied to every currently-known row. Re-runs if more rows are streamed in
    // while the flag is still on, so newly-arriving rows are opened too.
    useEffect(() => {
        if (expandAll) {
            setOpenIndices(new Set(resources.map((_, i) => i)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expandAll, resources.length]);

    // "Collapse All".
    useEffect(() => {
        if (collapseAll) {
            setOpenIndices(new Set());
        }
    }, [collapseAll]);

    // Reacts to the `resourceCardExpanded` prop (IndexPage's single-id auto-expand flag)
    // flipping on an already-mounted ResourceList — e.g. client-side navigation from a list view
    // to a single-id view re-uses this same component instance rather than remounting it, so the
    // lazy initializer above (which only runs once) wouldn't otherwise pick up the change.
    // Mirrors ResourceCard's own `prevExpandedRef` effect, applied list-wide instead of per-card.
    const prevResourceCardExpandedRef = useRef(resourceCardExpanded);
    useEffect(() => {
        if (prevResourceCardExpandedRef.current !== resourceCardExpanded) {
            prevResourceCardExpandedRef.current = resourceCardExpanded;
            setOpenIndices(resourceCardExpanded ? new Set(resources.map((_, i) => i)) : new Set());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resourceCardExpanded, resources.length]);

    const handleToggle = useCallback((rowIndex: number) => {
        setOpenIndices((prev) => {
            const next = new Set(prev);
            if (next.has(rowIndex)) {
                next.delete(rowIndex);
            } else {
                next.add(rowIndex);
            }
            return next;
        });
        setExpandAll(false);
        setCollapseAll(false);
    }, [setExpandAll, setCollapseAll]);

    return (
        <Box
            ref={parentRef}
            sx={{ overflow: 'auto', contain: 'content' }}
            style={{ maxHeight: '75vh' }}
        >
            <Box sx={{ width: '100%', position: 'relative' }} style={{ height: virtualizer.getTotalSize() }}>
                {virtualizer.getVirtualItems().map((virtualRow) => {
                    const fullResource = resources[virtualRow.index];
                    const resource = fullResource.resource || fullResource;
                    const error = resource.resourceType === 'OperationOutcome';
                    return (
                        <Box
                            key={virtualRow.key}
                            ref={virtualizer.measureElement}
                            data-index={virtualRow.index}
                            sx={{ position: 'absolute', top: 0, left: 0, width: '100%' }}
                            style={{ transform: `translateY(${virtualRow.start}px)` }}
                        >
                            <ResourceCard
                                index={indexStart + virtualRow.index}
                                resource={resource}
                                expanded={resourceCardExpanded}
                                error={error}
                                open={openIndices.has(virtualRow.index)}
                                onToggle={() => handleToggle(virtualRow.index)}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default ResourceList;
