import { useTheme } from '@/src/context/ThemeContext';
import { darkColors, lightColors, ThemeColors } from '@/src/theme/colors';

/**
 * Hook that returns theme-aware colors
 * Use this instead of importing colors directly for dark mode support
 */
export function useColors(): ThemeColors {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
}
