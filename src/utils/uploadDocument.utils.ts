export const ACCEPTED_UPLOAD_EXTENSIONS: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
};

export const ACCEPTED_UPLOAD_ACCEPT_ATTR = Object.keys(ACCEPTED_UPLOAD_EXTENSIONS)
    .map((ext) => `.${ext}`)
    .join(',');

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export type ValidateUploadFileResult = { contentType: string } | { error: string };

// file.type (the browser-reported MIME type) is deliberately never consulted here — it's
// frequently empty for HEIC and inconsistent across OS file associations for txt/json/xml.
// The file extension is the only source of truth for both the allow-list and the resolved
// contentType, so Binary.contentType and DocumentReference.content[0].attachment.contentType
// always agree with each other and with what was actually validated.
export function validateUploadFile(file: { name: string; size: number }): ValidateUploadFileResult {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const contentType = extension ? ACCEPTED_UPLOAD_EXTENSIONS[extension] : undefined;
    if (!contentType) {
        return {
            error: `Unsupported file type. Accepted extensions: ${Object.keys(ACCEPTED_UPLOAD_EXTENSIONS).join(', ')}.`,
        };
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        return { error: `File is too large. Maximum size is ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB.` };
    }
    return { contentType };
}

// FHIR's Binary.data is a base64Binary, not a data URL — the "data:<mime>;base64," prefix
// FileReader.readAsDataURL produces has to be stripped before the result can be sent to the
// FHIR server.
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            resolve(commaIndex === -1 ? result : result.slice(commaIndex + 1));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export function buildSubjectReference({ resourceType, id }: { resourceType: string; id: string }): string {
    return `Patient/${resourceType === 'Person' ? 'person.' : ''}${id}`;
}
