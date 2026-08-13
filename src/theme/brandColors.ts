// b.well Brand Style Guide (May 2023), section 2.1 Color Palette.
export const brandColors = {
  blue: '#2E3586',
  darkBlue: '#191D4D',
  green: '#6CC63F',
  lilac: '#6C60ED',
  orange: '#F56345',
  yellow: '#FFE249',
  darkGray: '#494949',
  midGray: '#7F7F7F',
  lightGray: '#F7F7FA',
  white: '#FFFFFF',
  // Not defined in the brand guide (no palette entry maps to "error"/destructive).
  // Chosen to be WCAG AA-contrasting on white and outside the brand hues, so error
  // states stay visually distinct from the rest of the palette per the brand rule
  // that red is reserved for errors only.
  errorRed: '#D32F2F',
} as const;
