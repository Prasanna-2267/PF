export const brand = {
  navy950: '#10162F', navy900: '#18234A', navy800: '#252B69', indigo700: '#343D86',
  indigo600: '#4654A3', indigo500: '#5B68BC', gold700: '#8E672B', gold600: '#A87935',
  gold500: '#B38A4A', gold400: '#C9A76A',
} as const;

export const themes = {
  light: {
    canvas: '#F7F8FB', surface: '#FFFFFF', elevated: '#FFFFFF', sunken: '#EEF0F5', rail: '#FFFFFF', line: '#E4E7EE', lineStrong: '#D4D9E4', fg: '#11131A', muted: '#5F6677', faint: '#8B93A3', primary: brand.indigo600, primaryStrong: brand.indigo700, primaryFg: '#FFFFFF', primarySoft: '#E9ECF8', gold: brand.gold500, goldStrong: brand.gold700, goldSoft: '#F4EAD8', success: '#238A5A', successSoft: '#EAF7F0', danger: '#C2414B', dangerSoft: '#FDEDEF', warn: '#B7791F', warnSoft: '#FFF7E5',
  },
  dark: {
    canvas: '#0D1226', surface: '#1B2342', elevated: '#232C52', sunken: '#141B30', rail: '#151C36', line: '#303958', lineStrong: '#414C70', fg: '#F5F6FA', muted: '#B9C0D2', faint: '#8891A8', primary: '#7C88DA', primaryStrong: '#929CE4', primaryFg: '#0B1226', primarySoft: '#232C52', gold: brand.gold400, goldStrong: '#D8BC86', goldSoft: '#2A2413', success: '#34D399', successSoft: '#0E2A20', danger: '#F26B75', dangerSoft: '#2C1417', warn: '#FBBF24', warnSoft: '#2A2109',
  },
} as const;

export type AppTheme = (typeof themes)[keyof typeof themes];
export type ThemePreference = 'light' | 'dark' | 'system';
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { field: 12, card: 16, pill: 999 } as const;
export const font = { regular: 'Manrope_400Regular', medium: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', extraBold: 'Manrope_800ExtraBold' } as const;
