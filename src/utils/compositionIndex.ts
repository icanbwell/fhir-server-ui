import { TComposition } from '../types/resources/Composition';

export type TCompositionVersionColumn = {
    key: string;
    label: string;
    source: string;
};

// Ordered newest-first. This *is* an allowlist — a Composition whose `meta.source` isn't one of
// these three doesn't belong to the versioned Health Summary family at all (e.g. device-ingested
// Body System / Device Metric compositions), so buildCompositionMatrix routes it to `other`
// instead of forcing it into a same-shaped column, which would wrongly imply "another version of
// the same thing."
export const COMPOSITION_VERSIONS: TCompositionVersionColumn[] = [
    { key: 'v3', label: 'V3', source: 'https://www.icanbwell.com/fhir-composition-service' },
    { key: 'v2', label: 'V2', source: 'https://www.icanbwell.com/intelligence-layer-databricks' },
    { key: 'v1', label: 'V1', source: 'https://www.icanbwell.com/intelligence-layer-pipeline' },
];

// The entire synonym map today: V1 emits "allergy_summary_document" where
// V2/V3 emit "allergyintolerance_summary_document" for the same category.
// Unmapped codes pass through unchanged and get their own row.
const CATEGORY_SYNONYMS: Record<string, string> = {
    allergy: 'allergyintolerance',
};

const stripTrailingSlash = (value: string): string =>
    value.endsWith('/') ? value.slice(0, -1) : value;

const getRawTypeCode = (composition: TComposition): string | undefined =>
    composition.type?.coding?.[0]?.code?.toString();

export const getCategoryKey = (composition: TComposition): string => {
    const code = getRawTypeCode(composition);
    if (!code) {
        return 'unknown';
    }
    const key = code.replace(/_summary_document$/, '');
    // key comes from FHIR response data (not user input) and CATEGORY_SYNONYMS is a small fixed
    // lookup table, so this isn't the untrusted-index case the rule guards against.
    // eslint-disable-next-line security/detect-object-injection
    return CATEGORY_SYNONYMS[key] ?? key;
};

// Returns a known version's key (v1/v2/v3) when meta.source matches one of
// COMPOSITION_VERSIONS, tolerating a trailing slash. Otherwise returns the raw
// source string itself, which doubles as that unrecognized version's key.
export const getVersionKey = (composition: TComposition): string => {
    const source = composition.meta?.source?.toString();
    if (!source) {
        return 'unknown';
    }
    const normalized = stripTrailingSlash(source);
    const known = COMPOSITION_VERSIONS.find(
        (version) => stripTrailingSlash(version.source) === normalized
    );
    return known?.key ?? source;
};

export type TCompositionMatrixCell = {
    id: string;
    lastUpdated?: string;
};

export type TCompositionMatrixRow = {
    categoryKey: string;
    // Every distinct raw FHIR type code merged into this row, sorted. A row usually has one, but
    // e.g. the allergyintolerance row has both V1's "allergy_..." and V2/V3's
    // "allergyintolerance_..." codes — surfaced so that merge stays visible instead of hidden.
    typeCodes: string[];
    cells: Record<string, TCompositionMatrixCell[]>;
};

// A Composition whose `meta.source` isn't one of the three known Health Summary versions —
// listed individually rather than grouped, since we don't know the right discriminator for an
// unfamiliar source (grouping by type code alone would repeat the exact bug that put e.g. five
// distinct "Body System" categories under one row before this existed).
export type TOtherComposition = {
    id: string;
    title?: string;
    source?: string;
    typeCode?: string;
    lastUpdated?: string;
};

export type TCompositionMatrix = {
    columns: TCompositionVersionColumn[];
    rows: TCompositionMatrixRow[];
    other: TOtherComposition[];
};

const isKnownVersionKey = (versionKey: string): boolean =>
    COMPOSITION_VERSIONS.some((version) => version.key === versionKey);

const columnForVersionKey = (key: string): TCompositionVersionColumn =>
    COMPOSITION_VERSIONS.find((version) => version.key === key) ?? { key, label: key, source: key };

export const buildCompositionMatrix = (compositions: TComposition[]): TCompositionMatrix => {
    const rowsByCategory = new Map<string, Map<string, TCompositionMatrixCell[]>>();
    const typeCodesByCategory = new Map<string, Set<string>>();
    const versionKeysPresent = new Set<string>();
    const other: TOtherComposition[] = [];

    for (const comp of compositions) {
        const versionKey = getVersionKey(comp);

        if (!isKnownVersionKey(versionKey)) {
            other.push({
                id: comp.id?.toString() ?? '',
                title: comp.title?.toString(),
                source: comp.meta?.source?.toString(),
                typeCode: getRawTypeCode(comp),
                lastUpdated: comp.meta?.lastUpdated?.toString(),
            });
            continue;
        }

        const categoryKey = getCategoryKey(comp);
        versionKeysPresent.add(versionKey);

        if (!rowsByCategory.has(categoryKey)) {
            rowsByCategory.set(categoryKey, new Map());
            typeCodesByCategory.set(categoryKey, new Set());
        }
        const cellsByVersion = rowsByCategory.get(categoryKey)!;
        if (!cellsByVersion.has(versionKey)) {
            cellsByVersion.set(versionKey, []);
        }
        cellsByVersion.get(versionKey)!.push({
            id: comp.id?.toString() ?? '',
            lastUpdated: comp.meta?.lastUpdated?.toString(),
        });

        const rawTypeCode = getRawTypeCode(comp);
        if (rawTypeCode) {
            typeCodesByCategory.get(categoryKey)!.add(rawTypeCode);
        }
    }

    const columns = COMPOSITION_VERSIONS.map((v) => v.key)
        .filter((key) => versionKeysPresent.has(key))
        .map(columnForVersionKey);

    const rows = [...rowsByCategory.entries()]
        .map(([categoryKey, cellsByVersion]) => ({
            categoryKey,
            typeCodes: [...typeCodesByCategory.get(categoryKey)!].sort(),
            cells: Object.fromEntries(cellsByVersion),
        }))
        .sort((a, b) => a.categoryKey.localeCompare(b.categoryKey));

    return { columns, rows, other };
};

// Bug Bash inputs are usually a bare Person uuid. The FHIR client-id convention prefixes it with
// "person." — this accepts either form. Intended for exactly one call site: turning free-text
// manual entry (CompositionIndexPage's "Go" button) into a URL segment. Do NOT call this on an
// id that's already been placed in a URL (e.g. the route param) - ResourceCard already encodes
// Patient-vs-Person unambiguously there (bare id vs "person."-prefixed id), and re-defaulting a
// bare id to Person there silently breaks every Patient-card entry point instead.
export const normalizePersonId = (raw: string): string => {
    const trimmed = raw.trim();
    return trimmed.includes('.') ? trimmed : `person.${trimmed}`;
};

export type TPersonReference = {
    resourceType: 'Person' | 'Patient';
    bareId: string;
    // What to pass as `patient=` on a Composition search. Person uses b.well's own bare
    // "person.{uuid}" convention (verified working); Patient needs the typed "Patient/{uuid}"
    // reference - verified live that a bare Patient uuid does not filter at all on the FHIR
    // server (it silently falls through to the server's default unfiltered result set).
    searchValue: string;
};

// Interprets an id already in the URL's encoding (see normalizePersonId's caveat above) into
// which resource it refers to and how to search for its Compositions.
export const parsePersonReference = (raw: string): TPersonReference => {
    const trimmed = raw.trim();
    if (trimmed.startsWith('person.')) {
        const bareId = trimmed.slice('person.'.length);
        return { resourceType: 'Person', bareId, searchValue: trimmed };
    }
    return { resourceType: 'Patient', bareId: trimmed, searchValue: `Patient/${trimmed}` };
};
