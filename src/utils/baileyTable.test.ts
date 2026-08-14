import { describe, expect, it } from 'vitest';
import { BAILEY_TABLE_GRID_ROW_THRESHOLD, extractTableData, shouldUseGrid, type HastNode } from './baileyTable';

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

        expect(extractTableData(node)).toEqual({
            headers: ['Name', 'Age'],
            rows: [
                ['Imran', '30'],
                ['Bob', '40'],
            ],
        });
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

        expect(extractTableData(node)).toEqual({
            headers: ['Name'],
            rows: [['Imran Qureshi']],
        });
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
        const rows = Array.from({ length: BAILEY_TABLE_GRID_ROW_THRESHOLD }, (_, i) => [String(i)]);
        expect(shouldUseGrid(rows)).toBe(false);
    });

    it(`is true just past the threshold (${BAILEY_TABLE_GRID_ROW_THRESHOLD + 1} rows)`, () => {
        const rows = Array.from({ length: BAILEY_TABLE_GRID_ROW_THRESHOLD + 1 }, (_, i) => [String(i)]);
        expect(shouldUseGrid(rows)).toBe(true);
    });
});
