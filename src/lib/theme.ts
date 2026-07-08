/** Palette et espacements partagés par l'application. */
export const colors = {
  primary: '#0B5FFF',
  primaryDark: '#0847C4',
  background: '#FFFFFF',
  surface: '#F4F6FA',
  bubbleOther: '#EDEFF3',
  bubbleMine: '#0B5FFF',
  text: '#12141A',
  textInverse: '#FFFFFF',
  textMuted: '#6A7180',
  border: '#E3E6EC',
  danger: '#D64545',
  success: '#2FA36B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

/** Couleur d'avatar déterministe à partir d'un identifiant. */
const AVATAR_COLORS = ['#0B5FFF', '#2FA36B', '#D64545', '#8B5CF6', '#E08A1E', '#0E9AA7'];
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
