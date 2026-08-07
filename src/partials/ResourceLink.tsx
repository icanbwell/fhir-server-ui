import Typography from '@mui/material/Typography';
import { TBaseResourceProps } from '../types/baseTypes';
import { Link } from 'react-router';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

type TResourceLinkProps = TBaseResourceProps & {
    resourceType: string;
    uuid: string;
};

const ResourceLink = ({ resourceType, uuid }: TResourceLinkProps) => {
    return (
        <Link title="Direct link to Resource" to={`/4_0_0/${resourceType}/${uuid}`}>
            <Typography>
                {resourceType}/{uuid}
            </Typography>{' '}
            <OpenInNewIcon />
        </Link>
    );
};

export default ResourceLink;
