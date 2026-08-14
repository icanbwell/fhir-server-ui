import { describe, expect, it } from 'vitest';
import { BAILEY_TABLE_GRID_ROW_THRESHOLD, extractTableData, shouldUseGrid, type BaileyTableCell, type HastNode } from './baileyTable';

const text = (value: string): HastNode => ({ type: 'text', value });

const cell = (tagName: 'th' | 'td', children: HastNode[]): HastNode => ({
    type: 'element',
    tagName,
    children,
});

const row = (tagName: 'th' | 'td', values: string[]): HastNode => ({
    type: 'element',
    tagName: 'tr',
    children: values.map((v) => cell(tagName, [text(v)])),
});

const table = (children: HastNode[]): HastNode => ({
    type: 'element',
    tagName: 'table',
    children,
});

const plainCells = (rows: BaileyTableCell[][]): string[][] => rows.map((r) => r.map((c) => c.text));

describe('extractTableData', () => {
    it('extracts headers and rows from a well-formed table node', () => {
        const node = table([
            { type: 'element', tagName: 'thead', children: [row('th', ['Name', 'Age'])] },
            {
                type: 'element',
                tagName: 'tbody',
                children: [row('td', ['Imran', '30']), row('td', ['Bob', '40'])],
            },
        ]);

        const data = extractTableData(node);
        expect(data?.headers).toEqual(['Name', 'Age']);
        expect(plainCells(data?.rows ?? [])).toEqual([
            ['Imran', '30'],
            ['Bob', '40'],
        ]);
        expect(data?.rows.flat().every((c) => c.href === undefined)).toBe(true);
    });

    it('flattens nested inline formatting inside a cell to plain text', () => {
        const node = table([
            { type: 'element', tagName: 'thead', children: [row('th', ['Name'])] },
            {
                type: 'element',
                tagName: 'tbody',
                children: [
                    {
                        type: 'element',
                        tagName: 'tr',
                        children: [
                            cell('td', [
                                { type: 'element', tagName: 'strong', children: [text('Imran')] },
                                text(' Qureshi'),
                            ]),
                        ],
                    },
                ],
            },
        ]);

        const data = extractTableData(node);
        expect(data?.headers).toEqual(['Name']);
        expect(plainCells(data?.rows ?? [])).toEqual([['Imran Qureshi']]);
    });

    it('preserves the href of a markdown link inside a cell', () => {
        const node = table([
            { type: 'element', tagName: 'thead', children: [row('th', ['Patient'])] },
            {
                type: 'element',
                tagName: 'tbody',
                children: [
                    {
                        type: 'element',
                        tagName: 'tr',
                        children: [
                            cell('td', [
                                {
                                    type: 'element',
                                    tagName: 'a',
                                    properties: { href: 'https://fhir.example.com/Patient/123' },
                                    children: [text('View Patient')],
                                },
                            ]),
                        ],
                    },
                ],
            },
        ]);

        const data = extractTableData(node);
        expect(data?.rows).toEqual([[{ text: 'View Patient', href: 'https://fhir.example.com/Patient/123' }]]);
    });

    it('returns rows: [] for a table with only a header row', () => {
        const node = table([{ type: 'element', tagName: 'thead', children: [row('th', ['Name'])] }]);

        expect(extractTableData(node)).toEqual({ headers: ['Name'], rows: [] });
    });

    it('returns null for a node that is not a table element', () => {
        const node: HastNode = { type: 'element', tagName: 'p', children: [text('not a table')] };

        expect(extractTableData(node)).toBeNull();
    });
});

describe('shouldUseGrid', () => {
    it(`is false at the threshold (${BAILEY_TABLE_GRID_ROW_THRESHOLD} rows)`, () => {
        const rows: BaileyTableCell[][] = Array.from({ length: BAILEY_TABLE_GRID_ROW_THRESHOLD }, (_, i) => [{ text: String(i) }]);
        expect(shouldUseGrid(rows)).toBe(false);
    });

    it(`is true just past the threshold (${BAILEY_TABLE_GRID_ROW_THRESHOLD + 1} rows)`, () => {
        const rows: BaileyTableCell[][] = Array.from({ length: BAILEY_TABLE_GRID_ROW_THRESHOLD + 1 }, (_, i) => [{ text: String(i) }]);
        expect(shouldUseGrid(rows)).toBe(true);
    });
});
