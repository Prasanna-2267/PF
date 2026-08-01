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
    canvas: '#090B0D', surface: '#14171B', elevated: '#1A1E23', sunken: '#0E1013', rail: '#0C0E11', line: '#282E35', lineStrong: '#39414A', fg: '#F5F7F8', muted: '#A2A9B2', faint: '#69717C', primary: '#7C9CFF', primaryStrong: '#B9C7FF', primaryFg: '#080C18', primarySoft: '#18213D', gold: '#D9AA57', goldStrong: '#F0C878', goldSoft: '#302618', success: '#67D6A7', successSoft: '#153429', danger: '#F07B85', dangerSoft: '#35191D', warn: '#E9B85D', warnSoft: '#342A17',
  },
} as const;

export type AppTheme = (typeof themes)[keyof typeof themes];
export type ThemePreference = 'light' | 'dark' | 'system';
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { field: 12, card: 16, pill: 999 } as const;
export const font = { regular: 'Manrope_400Regular', medium: 'Manrope_500Medium', semibold: 'Manrope_600SemiBold', bold: 'Manrope_700Bold', extraBold: 'Manrope_800ExtraBold' } as const;
