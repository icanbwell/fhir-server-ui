declare module 'rtf.js' {
    export namespace RTFJS {
        function loggingEnabled(enabled: boolean): void;
        class Document {
            constructor(buffer: ArrayBuffer);
            metadata(): Record<string, unknown>;
            render(): Promise<HTMLElement[]>;
        }
    }
}
