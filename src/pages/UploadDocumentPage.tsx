import React, { useContext, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FhirApi from '../api/fhirApi';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import {
    ACCEPTED_UPLOAD_ACCEPT_ATTR,
    buildSubjectReference,
    fileToBase64,
    validateUploadFile,
} from '../utils/uploadDocument.utils';

type TSelectedFile = {
    file: File;
    contentType: string;
};

const UploadDocumentPage = (): React.ReactElement => {
    const { resourceType = '', id = '' } = useParams<{ resourceType: string; id: string }>();
    const { fhirUrl } = useContext(EnvContext);
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState<TSelectedFile | undefined>();
    const [description, setDescription] = useState('');
    const [validationError, setValidationError] = useState<string | undefined>();
    const [submitError, setSubmitError] = useState<React.ReactNode | undefined>();
    const [submitting, setSubmitting] = useState(false);

    const subjectReference = buildSubjectReference({ resourceType, id });
    const isValidResourceType = resourceType === 'Patient' || resourceType === 'Person';

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }
        const result = validateUploadFile(file);
        if ('error' in result) {
            setSelectedFile(undefined);
            setValidationError(result.error);
            return;
        }
        setValidationError(undefined);
        setSubmitError(undefined);
        setSelectedFile({ file, contentType: result.contentType });
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            return;
        }
        setSubmitting(true);
        setSubmitError(undefined);
        try {
            const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
            const data = await fileToBase64(selectedFile.file);
            const binaryId = crypto.randomUUID();
            const binaryResult = await fhirApi.mergeResource({
                resourceType: 'Binary',
                id: binaryId,
                resource: {
                    resourceType: 'Binary',
                    id: binaryId,
                    contentType: selectedFile.contentType,
                    data,
                },
            });
            if (!binaryResult.status || binaryResult.status < 200 || binaryResult.status >= 300) {
                setSubmitError(
                    `Failed to create Binary resource (status ${binaryResult.status ?? 'unknown'}): ${JSON.stringify(
                        binaryResult.json
                    )}`
                );
                return;
            }
            if (binaryResult.json?.resourceType === 'OperationOutcome' || Array.isArray(binaryResult.json?.issue)) {
                setSubmitError(
                    `Failed to create Binary resource (status ${binaryResult.status ?? 'unknown'}): ${JSON.stringify(
                        binaryResult.json
                    )}`
                );
                return;
            }

            const docRefId = crypto.randomUUID();
            const docRefResult = await fhirApi.mergeResource({
                resourceType: 'DocumentReference',
                id: docRefId,
                resource: {
                    resourceType: 'DocumentReference',
                    id: docRefId,
                    status: 'current',
                    subject: { reference: subjectReference },
                    date: new Date().toISOString(),
                    description: description || undefined,
                    content: [
                        {
                            attachment: {
                                contentType: selectedFile.contentType,
                                url: `Binary/${binaryId}`,
                                title: selectedFile.file.name,
                            },
                        },
                    ],
                },
            });
            if (!docRefResult.status || docRefResult.status < 200 || docRefResult.status >= 300) {
                setSubmitError(
                    <>
                        Failed to create DocumentReference (status {docRefResult.status ?? 'unknown'}):{' '}
                        {JSON.stringify(docRefResult.json)}. The Binary resource was created and is not
                        automatically cleaned up —{' '}
                        <RouterLink to={`/4_0_0/Binary/${binaryId}`}>view/delete Binary/{binaryId}</RouterLink>.
                    </>
                );
                return;
            }
            if (docRefResult.json?.resourceType === 'OperationOutcome' || Array.isArray(docRefResult.json?.issue)) {
                setSubmitError(
                    <>
                        Failed to create DocumentReference (status {docRefResult.status ?? 'unknown'}):{' '}
                        {JSON.stringify(docRefResult.json)}. The Binary resource was created and is not
                        automatically cleaned up —{' '}
                        <RouterLink to={`/4_0_0/Binary/${binaryId}`}>view/delete Binary/{binaryId}</RouterLink>.
                    </>
                );
                return;
            }

            navigate(`/4_0_0/DocumentReference/${docRefId}`);
        } catch (error) {
            setSubmitError(
                `Failed to prepare or upload the file: ${error instanceof Error ? error.message : String(error)}`
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2, maxWidth: 640 }}>
                    {!isValidResourceType ? (
                        <>
                            <Typography variant="h5" sx={{ mb: 2 }}>
                                Upload Document
                            </Typography>
                            <Alert severity="error">
                                Unsupported resource type for document upload: {resourceType}. Only Patient and Person
                                are supported.
                            </Alert>
                        </>
                    ) : (
                        <>
                            <Typography variant="h5" sx={{ mb: 2 }}>
                                Upload Document
                            </Typography>
                            <Typography sx={{ mb: 2 }}>Uploading for: {subjectReference}</Typography>

                            {validationError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {validationError}
                                </Alert>
                            )}
                            {submitError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {submitError}
                                </Alert>
                            )}

                            <Box sx={{ mb: 2 }}>
                                <Button variant="outlined" component="label">
                                    {selectedFile ? selectedFile.file.name : 'Choose File'}
                                    <input
                                        type="file"
                                        hidden
                                        accept={ACCEPTED_UPLOAD_ACCEPT_ATTR}
                                        data-testid="upload-document-file-input"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            </Box>

                            <TextField
                                label="Description"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <Button variant="contained" disabled={!selectedFile || submitting} onClick={handleSubmit}>
                                {submitting ? 'Uploading…' : 'Upload'}
                            </Button>
                        </>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default UploadDocumentPage;
