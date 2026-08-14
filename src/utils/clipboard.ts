export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        /* ignore — older browsers / missing clipboard permission */
    }
}
