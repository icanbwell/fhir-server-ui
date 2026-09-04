import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FhirApi from '../api/fhirApi';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { SecurityTagSystem } from '../utils/securityTagSystem';
import {
    ACCEPTED_UPLOAD_ACCEPT_ATTR,
    buildSubjectReference,
    extractMergeFailureMessage,
    fileToBase64,
    validateUploadFile,
} from '../utils/uploadDocument.utils';

type TSelectedFile = {
    file: File;
    contentType: string;
};

// This admin tool's uploads are treated as b.well-owned, not owned by whichever client the
// subject Patient/Person happens to belong to - matching the "DocumentReference | Digital
// Wallet (BWell)" row in the PROA data-sharing provenance table, not the subject's own tags.
const BWELL_OWNER_SECURITY_TAGS = [
    { system: SecurityTagSystem.owner, code: 'bwell' },
    { system: SecurityTagSystem.access, code: 'bwell' },
    { system: SecurityTagSystem.sourceAssigningAuthority, code: 'bwell' },
];

// The FHIR server rejects $merge writes with "Missing either metadata or metadata source" when
// meta.source is absent (resourceValidator.js, requireMetaSourceTags). Every other write path in
// this app edits an existing resource that already carries a meta.source from whatever originally
// created it, so a freshly client-authored resource needs one set explicitly.
const META_SOURCE = 'https://www.icanbwell.com/fhir-server-ui';

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

            const docRefId = crypto.randomUUID();
            const docRefResult = await fhirApi.mergeResource({
                resourceType: 'DocumentReference',
                id: docRefId,
                resource: {
                    resourceType: 'DocumentReference',
                    id: docRefId,
                    status: 'current',
                    meta: {
                        source: META_SOURCE,
                        security: [
                            ...BWELL_OWNER_SECURITY_TAGS,
                            { system: SecurityTagSystem.sourcePatientId, code: subjectReference },
                        ],
                    },
                    subject: { reference: subjectReference },
                    date: new Date().toISOString(),
                    description: description || undefined,
                    content: [
                        {
                            attachment: {
                                contentType: selectedFile.contentType,
                                data,
                                size: selectedFile.file.size,
                                title: selectedFile.file.name,
                            },
                        },
                    ],
                },
            });
            if (!docRefResult.status || docRefResult.status < 200 || docRefResult.status >= 300) {
                setSubmitError(
                    `Failed to create DocumentReference (status ${docRefResult.status ?? 'unknown'}): ${JSON.stringify(
                        docRefResult.json
                    )}`
                );
                return;
            }
            const docRefFailureMessage = extractMergeFailureMessage(docRefResult.json);
            if (docRefFailureMessage) {
                setSubmitError(
                    `Failed to create DocumentReference (status ${docRefResult.status ?? 'unknown'}): ${docRefFailureMessage}`
                );
                return;
            }
            if (docRefResult.incomplete) {
                setSubmitError('Failed to create DocumentReference: connection dropped mid-response.');
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
                                Unsupported resource type for document upload: {resourceType}. Only
                                Patient and Person are supported.
                            </Alert>
                        </>
                    ) : (
                        <>
                            <Typography variant="h5" sx={{ mb: 2 }}>
                                Upload Document
                            </Typography>
                            <Typography sx={{ mb: 2 }}>
                                Uploading for: {subjectReference}
                            </Typography>

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

                            <Button
                                variant="contained"
                                disabled={!selectedFile || submitting}
                                onClick={handleSubmit}
                            >
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
