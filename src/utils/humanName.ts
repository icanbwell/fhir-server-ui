import { THumanName } from '../types/partials/HumanName';

// Mirrors src/partials/HumanName.tsx's array normalization - some callers pass a single
// HumanName object rather than the array the FHIR type technically declares.
export const formatHumanName = (name?: THumanName[] | THumanName): string | undefined => {
    const names = Array.isArray(name) ? name : name ? [name] : [];
    const first = names[0];
    if (!first) {
        return undefined;
    }
    if (first.text) {
        return first.text.toString();
    }
    const given = (first.given ?? []).map((g) => g.toString());
    const family = first.family?.toString();
    const combined = [...given, family].filter(Boolean).join(' ');
    return combined || undefined;
};
