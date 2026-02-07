
export type GameEngineType = 
  | 'swipe'
  | 'immersion'
  | 'split'
  | 'polaroid'
  | 'spectrum'
  | 'burn'
  | 'unknown';

interface UseGameEngineReturn {
  engineType: GameEngineType;
  gradientColors: readonly [string, string];
}

export const useGameEngine = (slug: string): UseGameEngineReturn => {
  // Map slugs to engines
  const getEngineType = (slug: string): GameEngineType => {
    switch (slug) {
      // Swipe Deck
      case 'crush':
      case 'between-us':
      case 'confessions':
        return 'swipe';

      // Deep Immersion
      case 'deep-night':
      case 'connected':
      case 'tell-me-everything':
      case 'intimacy':
        return 'immersion';

      // Split Decision
      case 'would-you-rather':
      case 'would-you-rather-hot':
      case 'this-or-that':
        return 'split';

      // Polaroid
      case 'memory-lane':
      case 'milestones':
        return 'polaroid';
      
      // Spectrum
      case 'is-it-okay':
      case 'hot-takes':
        return 'spectrum';

      // Burn
      case 'spicy':
        return 'burn';

      default:
        // Default fallbacks based on keywords if slug is unknown
        if (slug.includes('would-you-rather')) return 'split';
        if (slug.includes('dare')) return 'burn';
        return 'swipe';
    }
  };

  const getGradientColors = (slug: string): readonly [string, string] => {
     // We can reuse the colors from the map or define new specific engine themes
     // For now, let's return some defaults or we can import them from a constants file
     return ['#FF512F', '#DD2476']; // Default pink/red
  };

  return {
    engineType: getEngineType(slug),
    gradientColors: getGradientColors(slug),
  };
};
