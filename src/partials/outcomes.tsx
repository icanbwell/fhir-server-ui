import EnvContext from '../context/EnvironmentContext';
import React, { useContext } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { TBaseResourceProps, TOutcomes } from '../types/baseTypes';

type TOutcomesProps = TBaseResourceProps & {
    outcomes: TOutcomes | TOutcomes[] | undefined;
};

function Outcomes({ outcomes, name }: TOutcomesProps) {
    const { AWS_REGION } = useContext(EnvContext);

    if (outcomes && !Array.isArray(outcomes)) {
        outcomes = [outcomes];
    }

    if (!outcomes || outcomes.length === 0) {
        return <></>;
    }

    return (
        <React.Fragment>
            <Typography variant='h4'>{name}</Typography>
            <TableContainer>
                <Table aria-label='OutComes table'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Resource</TableCell>
                            <TableCell>Url</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {outcomes.map((outcome: TOutcomes, index: number) => {
                            if (outcome.url) {
                                const s3Url = outcome.url;
                                if (s3Url.substring(0, 5) === 's3://') {
                                    const s3Path = s3Url.substring(5);
                                    console.log(s3Path);
                                    const navigateUrl = `https://${AWS_REGION}.console.aws.amazon.com/s3/object/${s3Path}`;
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>{outcome.id}</TableCell>
                                            <TableCell>{outcome.type}</TableCell>
                                            <TableCell>
                                                <a
                                                    title={`S3 File ${navigateUrl}`}
                                                    href={navigateUrl}
                                                    target="_blank" rel="noreferrer"
                                                >
                                                    {navigateUrl}
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                            }
                            return null;
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </React.Fragment>
    );
}

export default Outcomes;
