// Appends `_format=json` to a relative FHIR URL, using `&` if it already has a query string.
export const appendFormatJson = (relativeUrl: string): string =>
    `${relativeUrl}${relativeUrl.includes('?') ? '&' : '?'}_format=json`;
