import { TDateTime } from '../types/simpleTypes/DateTime';

// FHIR dateTime values can be date-only or include a time component; format accordingly
// and let the caller show the raw value alongside for anyone who needs the exact string.
// dateStyle/timeStyle can't be combined with timeZoneName (Intl throws), so time values use
// individual field options instead so the viewer's local timezone abbreviation is visible.
export const formatHumanDate = (value?: TDateTime): string | null => {
    if (!value) {
        return null;
    }
    const parsed = new Date(String(value));
    if (isNaN(parsed.getTime())) {
        return null;
    }
    const hasTime = String(value).includes('T');
    return parsed.toLocaleString(
        undefined,
        hasTime
            ? {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
              }
            : { year: 'numeric', month: 'short', day: 'numeric' }
    );
};

// FHIR narrative field values are untyped strings, so a date is only recognizable by shape.
// Kept as two flat alternatives (rather than one regex with nested optional groups) to avoid
// the catastrophic-backtracking shape eslint-plugin-security's detect-unsafe-regex flags.
const DATE_ONLY_REGEX = /^\d{4}(-\d{2})?(-\d{2})?$/;
const DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

export const looksLikeIsoDate = (value: string): boolean =>
    DATE_ONLY_REGEX.test(value) || DATE_TIME_REGEX.test(value);
