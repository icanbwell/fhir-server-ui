import { Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import ReverseReferenceLink from './ReverseReferenceLink';

// Targets on a Person that are searched by client_person_id extension, not a patient reference.
const CLIENT_PERSON_ID_TARGETS: readonly string[] = ['Subscription', 'SubscriptionStatus'];

type TReverseReference = {
    target: string;
    property: string;
};

type TReverseReferenceProps = TBaseResourceProps & {
    reverseReferences: TReverseReference[];
};

function ReverseReference({ id, reverseReferences, resourceType }: TReverseReferenceProps) {
    const isPerson = resourceType === 'Person';
    let resolvedId = id;
    if (resourceType === 'Patient') {
        resolvedId = `Patient/${id}`;
    }
    if (isPerson) {
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
                            clientPersonId={
                                isPerson && id && CLIENT_PERSON_ID_TARGETS.includes(reference.target)
                                    ? String(id)
                                    : undefined
                            }
                        />
                    ) : null
                )}
            </Box>
        </Box>
    ) : null;
}

export default ReverseReference;
