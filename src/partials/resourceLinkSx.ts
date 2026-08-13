// Shared by ReferenceLink and ReverseReferenceLink: both render a resource-reference
// link followed by a trailing status/count indicator, and should stay visually in sync.
export const resourceLinkSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    textDecoration: 'none',
    '&:hover': {
        textDecoration: 'underline',
    },
} as const;
