// Minimal shape of the hast node react-markdown passes as `props.node` for a component
// override — enough to walk a GFM table's thead/tbody/tr/th/td structure without depending
// on transitive @types/hast resolution.
export interface HastNode {
    type: string;
    tagName?: string;
    value?: string;
    children?: HastNode[];
}

export const BAILEY_TABLE_GRID_ROW_THRESHOLD = 5;

const flattenText = (node: HastNode): string => {
    if (node.type === 'text') {
        return node.value ?? '';
    }
    return (node.children ?? []).map(flattenText).join('');
};

const findChild = (node: HastNode, tagName: string): HastNode | undefined =>
    (node.children ?? []).find((child) => child.tagName === tagName);

const extractRow = (rowNode: HastNode): string[] =>
    (rowNode.children ?? []).filter((child) => child.type === 'element').map(flattenText);

export const extractTableData = (node: HastNode): { headers: string[]; rows: string[][] } | null => {
    if (node.tagName !== 'table') {
        return null;
    }

    const thead = findChild(node, 'thead');
    const headerRow = thead && findChild(thead, 'tr');
    const headers = headerRow ? extractRow(headerRow) : [];

    const tbody = findChild(node, 'tbody');
    const rows = (tbody?.children ?? [])
        .filter((child) => child.tagName === 'tr')
        .map(extractRow);

    return { headers, rows };
};

export const shouldUseGrid = (rows: string[][]): boolean => rows.length > BAILEY_TABLE_GRID_ROW_THRESHOLD;
