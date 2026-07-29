export interface Article {
  slug: string;
  headline: string;
  deck: string;
  category: Category;
  body: string[];
  publishedAt: string;
  readTime: number;
  sources: string[];
  sourceUrls?: string[];
  featured?: boolean;
  exclusive?: boolean;
  pipelineSteps?: PipelineStep[];
  founding?: boolean;
}

export interface PipelineStep {
  name: string;
  status: 'complete' | 'in-progress' | 'pending';
  timestamp?: string;
  detail?: string;
}

export type Category =
  | 'TECHNOLOGY'
  | 'GEOPOLITICS'
  | 'CLIMATE'
  | 'FINANCE'
  | 'HEALTH'
  | 'CULTURE';

export const CATEGORY_COLORS: Record<Category, string> = {
  TECHNOLOGY: '#3B82F6',
  GEOPOLITICS: '#EF4444',
  CLIMATE: '#22C55E',
  FINANCE: '#F59E0B',
  HEALTH: '#A855F7',
  CULTURE: '#EC4899',
};

export const CATEGORY_META: Record<Category, { icon: string; description: string }> = {
  TECHNOLOGY: {
    icon: '⚡',
    description: 'AI, software, hardware, and the companies reshaping how we live and work.',
  },
  GEOPOLITICS: {
    icon: '🌐',
    description: 'Power shifts, diplomacy, conflict, and the forces rewriting the global order.',
  },
  CLIMATE: {
    icon: '🌱',
    description: 'Environmental science, energy transition, and the fight for a sustainable future.',
  },
  FINANCE: {
    icon: '📊',
    description: 'Markets, central banks, trade policy, and the economy that connects everything.',
  },
  HEALTH: {
    icon: '🧬',
    description: 'Medical breakthroughs, public health, biotech, and the science of human well-being.',
  },
  CULTURE: {
    icon: '🎭',
    description: 'Arts, ideas, social movements, and the stories that shape who we are.',
  },
};
