// Light mode colors
export const lightColors = {
  // Core
  primary: '#FF4B7D',
  secondary: '#FF8E53',
  background: '#FFF5F7',
  card: '#FFFFFF',
  text: '#2D2D2D',
  textSecondary: '#666666',
  muted: '#9E9E9E',
  border: '#F0F0F0',
  
  // Semantic
  success: '#22C55E',
  warning: '#FF9800',
  error: '#EF4444',
  
  // Accents
  accentPurple: '#9C27B0',
  accentBlue: '#2196F3',
  
  // Glass effects
  glass: 'rgba(255, 255, 255, 0.9)',
  glassDark: 'rgba(0, 0, 0, 0.05)',
  
  // Legacy compatibility
  teal: '#FFF5F7',
  coral: '#FF4B7D',
};

// Dark mode colors (matching black to dark magenta gradient)
export const darkColors = {
  // Core
  primary: '#FF6B94',
  secondary: '#FFA07A',
  background: '#0D0008', // Very dark with slight magenta tint
  card: '#1A0510', // Dark magenta-tinted card
  text: '#F5F5F5',
  textSecondary: '#B0B0B0',
  muted: '#808080',
  border: '#3D1025', // Dark magenta border
  
  // Semantic
  success: '#4ADE80',
  warning: '#FFB74D',
  error: '#F87171',
  
  // Accents
  accentPurple: '#BA68C8',
  accentBlue: '#64B5F6',
  
  // Glass effects
  glass: 'rgba(26, 5, 16, 0.9)', // Dark magenta glass
  glassDark: 'rgba(255, 255, 255, 0.05)',
  
  // Legacy compatibility
  teal: '#0D0008',
  coral: '#FF6B94',
};

// Export for backward compatibility
export const colors = lightColors;

// Type for colors
export type ThemeColors = typeof lightColors;
