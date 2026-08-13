import { describe, expect, it } from 'vitest';
import { extractPseudoToolCalls } from './baileyPseudoToolCalls';

describe('extractPseudoToolCalls', () => {
    it('extracts a search_tools block and a call_tool block written as plain text', () => {
        const text =
            "I'll search for vital signs observations on this FHIR server.\n\n" +
            '<search_tools>\n<category>fhir-server</category>\n<query>search observations vital signs</query>\n</search_tools>\n\n' +
            '<call_tool>\n<name>search_observations</name>\n<arguments>\n{\n  "category": "vital-signs"\n}\n</arguments>\n</call_tool>\n\n' +
            'I found vital signs observations on the server!';

        const { cleanedText, matches } = extractPseudoToolCalls(text);

        expect(matches).toEqual([
            { name: 'search_tools', args: '<category>fhir-server</category>\n<query>search observations vital signs</query>' },
            { name: 'search_observations', args: '{\n  "category": "vital-signs"\n}' },
        ]);
        expect(cleanedText).toBe(
            "I'll search for vital signs observations on this FHIR server.\n\nI found vital signs observations on the server!"
        );
    });

    it('returns the text unchanged when there are no pseudo tool call blocks', () => {
        const text = 'Here are the Observation resources for this patient.';
        expect(extractPseudoToolCalls(text)).toEqual({ cleanedText: text, matches: [] });
    });

    it('leaves an incomplete (still-streaming) block untouched', () => {
        const text = 'Let me check.\n\n<call_tool>\n<name>search_observations</name>';
        const { cleanedText, matches } = extractPseudoToolCalls(text);
        expect(matches).toEqual([]);
        expect(cleanedText).toBe(text);
    });

    it('falls back to a generic name when call_tool has no <name> tag', () => {
        const text = '<call_tool>\n<arguments>{}</arguments>\n</call_tool>';
        const { matches } = extractPseudoToolCalls(text);
        expect(matches).toEqual([{ name: 'unknown_tool', args: '{}' }]);
    });

    it('does not touch legitimate FHIR XML content like <Patient> or <code>', () => {
        const text = 'The resource looks like:\n<Patient>\n  <name>\n    <family>Doe</family>\n  </name>\n</Patient>';
        expect(extractPseudoToolCalls(text)).toEqual({ cleanedText: text, matches: [] });
    });
});
