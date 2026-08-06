import React, { useContext, useState } from 'react';
import { TExportStatus } from '../../types/customResources/ExportStatus';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.utils';
import Meta from '../../partials/Meta';
import Code from '../../partials/Code';
import DateTime from '../../partials/DateTime';
import Identifier from '../../partials/Identifier';
import { Button } from '@mui/material';
import UserContext from '../../context/UserContext';
import AdminApi from '../../api/adminApi';
import EnvContext from '../../context/EnvironmentContext';
import PreJson from '../../components/PreJson';
import { Link } from 'react-router';
import Outcomes from '../../partials/outcomes';


const ExportStatus = ({ resource }: { resource: TExportStatus }): React.ReactElement => {
    const sourceAssigningAuthority = resource?.meta?.security?.find(
        s => s.system === SecurityTagSystem.sourceAssigningAuthority
    )?.code;
    const uuid = resource.id && isUuid(`${resource.id}`) ?
        resource.id : generateUuidV5(`${resource.id}|${sourceAssigningAuthority}`);
    const { fhirUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);
    const [data, setData] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });

    const handleTriggerExport = async (exportStatusId: String | undefined) => {
        if (exportStatusId) {
            const response = await adminApi.triggerExport(exportStatusId);
            if (response.status === 200) {
                setIsEnabled(false);
            }
            setData(response);
            return;
        }
        console.error('ExportStatusId Undefined');
    };

    return (
        <>
            <Link title="Direct link to Resource" to={`/admin/${resource.resourceType}/${uuid}`}>
                {resource.resourceType}/{uuid}
            </Link>
            {
                resource.meta &&
                <Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='meta'
                    isAdminPage={true}
                />
            }
            {
                resource.identifier &&
                <Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='identifier'
                    isAdminPage={true}
                />
            }
            {
                resource.status &&
                <Code code={resource.status} name='Status' />
            }
            {
                resource.transactionTime &&
                <DateTime
                    dateTime={resource.transactionTime}
                    name='Created'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='created'
                />
            }
            {
                resource.output &&
                <Outcomes
                    name='Output'
                    outcomes={resource.output}
                />
            }
            {
                resource.errors &&
                <Outcomes
                    name='Errors'
                    outcomes={resource.errors}
                />
            }
            {
                <Button
                    style={{ marginBottom: '2vh', marginTop: '2vh' }}
                    type="submit"
                    variant="contained"
                    disabled={!isEnabled}
                    color="primary"
                    sx={{ mt: 1, mr: 1 }}
                    onClick={() => handleTriggerExport(resource.id)}
                >
                    {isEnabled ? 'Trigger Export Job' : 'Job has been Triggered'}
                </Button>
            }
            <PreJson data={data} />
        </>
    );
};

export default ExportStatus;
