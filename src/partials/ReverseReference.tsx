import { Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import ReverseReferenceLink from './ReverseReferenceLink';

type TReverseReference = {
    target: string;
    property: string;
};

type TReverseReferenceProps = TBaseResourceProps & {
    reverseReferences: TReverseReference[];
};

function ReverseReference({ id, reverseReferences, resourceType }: TReverseReferenceProps) {
    let resolvedId = id;
    if (resourceType === 'Patient') {
        resolvedId = `Patient/${id}`;
    }
    if (resourceType === 'Person') {
        resolvedId = `Patient/person.${id}`;
    }

    return reverseReferences && reverseReferences.length > 0 && reverseReferences[0] ? (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {reverseReferences.map((reference: TReverseReference, index: number) =>
                    reference ? (
                        <ReverseReferenceLink
                            key={`${index}`}
                            target={reference.target}
                            property={reference.property}
                            resolvedId={String(resolvedId)}
                        />
                    ) : null
                )}
            </Box>
        </Box>
    ) : null;
}

export default ReverseReference;
