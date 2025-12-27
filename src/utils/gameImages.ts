// Game background image mapping
// Maps game slugs to their background images

// Note: Images should be placed in assets/images/games-background/
// Using require() for static imports in React Native

export type GameSlug = 
  | 'between-us'
  | 'connected'
  | 'crush'
  | 'deep-night'
  | 'hard-dare'
  | 'intimacy'
  | 'is-it-okay'
  | 'memory-lane'
  | 'mirror'
  | 'tell-me-everything'
  | 'whos-more-likely'
  | 'would-you-rather'
  | 'would-you-rather-hot';

// We use a function to get images - returns null if image doesn't exist
// Images are optional - cards will use gradient-only fallback
export const getGameBackgroundImage = (slug: string): any | null => {
  try {
    const images: Record<string, any> = {
      'between-us': require('@/src/assets/images/games-background/between-us.png'),
      'connected': require('@/src/assets/images/games-background/connected.png'),
      'crush': require('@/src/assets/images/games-background/crush.png'),
      'deep-night': require('@/src/assets/images/games-background/deep-night.png'),
      'hard-dare': require('@/src/assets/images/games-background/hard-dare.png'),
      'intimacy': require('@/src/assets/images/games-background/intimacy.png'),
      'is-it-okay': require('@/src/assets/images/games-background/is-it-okay.png'),
      'memory-lane': require('@/src/assets/images/games-background/memory-lane.png'),
      'mirror': require('@/src/assets/images/games-background/mirror.png'),
      'tell-me-everything': require('@/src/assets/images/games-background/tell-me-everything.png'),
      'whos-more-likely': require('@/src/assets/images/games-background/whos-more-likely.png'),
      'would-you-rather': require('@/src/assets/images/games-background/would-you-rather.png'),
      'would-you-rather-hot': require('@/src/assets/images/games-background/would-you-rather-hot.png'),
    };
    return images[slug] || null;
  } catch {
    return null;
  }
};

// Game metadata with all info needed for cards
export interface GameMeta {
  slug: string;
  title: string;
  subtitle: string;
  gradientColors: readonly [string, string];
  category: 'discovery' | 'couple' | 'date-night' | 'intimacy';
}

export const GAMES_METADATA: GameMeta[] = [
  // Discovery
  {
    slug: 'crush',
    title: 'Crush',
    subtitle: 'Flirty content in the sweet spot between romance and deep conversation',
    gradientColors: ['#EC407A', '#D81B60'],
    category: 'discovery',
  },
  {
    slug: 'deep-night',
    title: 'Deep Night',
    subtitle: 'Late-night confessions and vulnerable, soulful sharing',
    gradientColors: ['#5C6BC0', '#3949AB'],
    category: 'discovery',
  },
  {
    slug: 'is-it-okay',
    title: 'Is it Okay?',
    subtitle: 'A judgement-free zone for controversial relationship questions',
    gradientColors: ['#26A69A', '#00897B'],
    category: 'discovery',
  },
  // As a Couple
  {
    slug: 'connected',
    title: 'Connected',
    subtitle: 'Meaningful dialogue focused on strengthening emotional foundations',
    gradientColors: ['#42A5F5', '#1E88E5'],
    category: 'couple',
  },
  {
    slug: 'whos-more-likely',
    title: "Who's More Likely",
    subtitle: 'A fun, superlative-style game to compare perceptions',
    gradientColors: ['#AB47BC', '#8E24AA'],
    category: 'couple',
  },
  {
    slug: 'memory-lane',
    title: 'Memory Lane',
    subtitle: 'A nostalgic journey through your relationship milestones',
    gradientColors: ['#66BB6A', '#43A047'],
    category: 'couple',
  },
  {
    slug: 'mirror',
    title: 'Mirror',
    subtitle: 'How well do you know your partner? Test your knowledge!',
    gradientColors: ['#29B6F6', '#039BE5'],
    category: 'couple',
  },
  // Date Night
  {
    slug: 'would-you-rather',
    title: 'Would You Rather',
    subtitle: 'Classic dilemmas for playful debates and surprising revelations',
    gradientColors: ['#FFA726', '#FB8C00'],
    category: 'date-night',
  },
  {
    slug: 'between-us',
    title: 'Between Us',
    subtitle: 'A wildcard mix of funny anecdotes and serious reflections',
    gradientColors: ['#7E57C2', '#5E35B1'],
    category: 'date-night',
  },
  {
    slug: 'tell-me-everything',
    title: 'Tell Me Everything',
    subtitle: 'Total transparency prompts for honest, open storytelling',
    gradientColors: ['#26C6DA', '#00ACC1'],
    category: 'date-night',
  },
  // Intimacy (18+)
  {
    slug: 'would-you-rather-hot',
    title: 'Would You Rather Hot',
    subtitle: 'Uncensored dilemmas for adventurous couples',
    gradientColors: ['#E53935', '#C62828'],
    category: 'intimacy',
  },
  {
    slug: 'intimacy',
    title: 'Intimacy',
    subtitle: 'Build physical and emotional heat together',
    gradientColors: ['#AD1457', '#880E4F'],
    category: 'intimacy',
  },
  {
    slug: 'hard-dare',
    title: 'Hard Dare',
    subtitle: 'Boundary-pushing challenges for daring couples',
    gradientColors: ['#6A1B9A', '#4A148C'],
    category: 'intimacy',
  },
];

export const getGamesByCategory = (category: GameMeta['category']) => 
  GAMES_METADATA.filter(g => g.category === category);

export const getGameMeta = (slug: string) => 
  GAMES_METADATA.find(g => g.slug === slug);
