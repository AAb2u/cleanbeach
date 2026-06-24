// Palette professionnelle « Bleu océan profond » : teal/cyan profond sobre,
// fonds neutres slate, accent ambre utilisé avec parcimonie.
export const Colors = {
  light: {
    primary: '#0E7490',
    primaryDark: '#155E75',
    secondary: '#059669',
    secondaryDark: '#047857',
    accent: '#F59E0B',
    accentDark: '#D97706',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    textOnPrimary: '#FFFFFF',
    border: '#E2E8F0',
    error: '#DC2626',
    errorDark: '#B91C1C',
    warning: '#D97706',
    success: '#059669',
    cardShadow: 'rgba(15, 23, 42, 0.08)',
    primaryShadow: 'rgba(14, 116, 144, 0.32)',
    secondaryShadow: 'rgba(5, 150, 105, 0.28)',
  },
  dark: {
    primary: '#22D3EE',
    primaryDark: '#0891B2',
    secondary: '#34D399',
    secondaryDark: '#10B981',
    accent: '#FBBF24',
    accentDark: '#F59E0B',
    background: '#0B1120',
    surface: '#16202E',
    surfaceAlt: '#243244',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textOnPrimary: '#04121C',
    border: '#2A3A4D',
    error: '#F87171',
    errorDark: '#EF4444',
    warning: '#FBBF24',
    success: '#34D399',
    cardShadow: 'rgba(0, 0, 0, 0.45)',
    primaryShadow: 'rgba(34, 211, 238, 0.22)',
    secondaryShadow: 'rgba(52, 211, 153, 0.22)',
  },
};

// Dégradés sobres (hues proches) pour des boutons et en-têtes au rendu pro.
export const Gradients = {
  light: {
    primary: ['#1496B0', '#0E7490', '#155E75'] as const,
    secondary: ['#10B981', '#059669', '#047857'] as const,
    accent: ['#FBBF24', '#F59E0B', '#D97706'] as const,
    danger: ['#EF4444', '#DC2626', '#B91C1C'] as const,
  },
  dark: {
    primary: ['#67E8F9', '#22D3EE', '#0891B2'] as const,
    secondary: ['#6EE7B7', '#34D399', '#10B981'] as const,
    accent: ['#FCD34D', '#FBBF24', '#F59E0B'] as const,
    danger: ['#FCA5A5', '#F87171', '#EF4444'] as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 34,
};
