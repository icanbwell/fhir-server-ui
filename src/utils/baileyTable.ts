// Minimal shape of the hast node react-markdown passes as `props.node` for a component
// override — enough to walk a GFM table's thead/tbody/tr/th/td structure without depending
// on transitive @types/hast resolution.
export interface HastNode {
    type: string;
    tagName?: string;
    value?: string;
    properties?: { href?: string };
    children?: HastNode[];
}

export interface BaileyTableCell {
    text: string;
    href?: string;
}

export const BAILEY_TABLE_GRID_ROW_THRESHOLD = 5;

const flattenText = (node: HastNode): string => {
    if (node.type === 'text') {
        return node.value ?? '';
    }
    return (node.children ?? []).map(flattenText).join('');
};

// Finds the first <a href="..."> anywhere inside a cell's subtree. GFM table cells only contain
// inline content (no nested tables/blocks), so a cell has at most one meaningful link — without
// this, a cell like `[View Patient](https://.../Patient/123)` loses its URL once flattened to
// plain text, silently breaking hyperlinks once a table crosses the grid threshold below.
const findHref = (node: HastNode): string | undefined => {
    if (node.tagName === 'a' && node.properties?.href) {
        return node.properties.href;
    }
    for (const child of node.children ?? []) {
        const href = findHref(child);
        if (href) {
            return href;
        }
    }
    return undefined;
};

const findChild = (node: HastNode, tagName: string): HastNode | undefined =>
    (node.children ?? []).find((child) => child.tagName === tagName);

const extractCell = (cellNode: HastNode): BaileyTableCell => {
    const text = flattenText(cellNode);
    const href = findHref(cellNode);
    return href ? { text, href } : { text };
};

const extractRow = (rowNode: HastNode): BaileyTableCell[] =>
    (rowNode.children ?? []).filter((child) => child.type === 'element').map(extractCell);

export const extractTableData = (node: HastNode): { headers: string[]; rows: BaileyTableCell[][] } | null => {
    if (node.tagName !== 'table') {
        return null;
    }

    const thead = findChild(node, 'thead');
    const headerRow = thead && findChild(thead, 'tr');
    const headers = headerRow ? extractRow(headerRow).map((cell) => cell.text) : [];

    const tbody = findChild(node, 'tbody');
    const rows = (tbody?.children ?? [])
        .filter((child) => child.tagName === 'tr')
        .map(extractRow);

    return { headers, rows };
};

export const shouldUseGrid = (rows: BaileyTableCell[][]): boolean => rows.length > BAILEY_TABLE_GRID_ROW_THRESHOLD;
