import { Article, Category } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Content directory for generated articles.
 * Articles are stored as individual JSON files.
 */
const CONTENT_DIR = path.join(process.cwd(), 'content', 'articles');

/**
 * Load all articles from the content directory.
 * Falls back gracefully if the directory doesn't exist yet.
 */
function loadArticlesFromDisk(): Article[] {
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      console.warn('[articles] Content directory not found, returning empty array');
      return [];
    }

    const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
    const articles: Article[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
        const article = JSON.parse(raw) as Article;
        articles.push(article);
      } catch {
        console.warn(`[articles] Failed to parse ${file}, skipping`);
      }
    }

    return articles;
  } catch {
    return [];
  }
}

/**
 * All articles, loaded from the /content/articles/ directory at import time.
 * In Next.js server components this runs at build time (SSG) or request time (SSR).
 */
export const articles: Article[] = loadArticlesFromDisk();

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: string): Article[] {
  return articles.filter((a) => a.category === category);
}

// ============================================
// Editorial-Weight Scoring Algorithm
// ============================================

/**
 * Score an article using the editorial-weight algorithm.
 * Higher score = more newsworthy / higher editorial quality.
 */
function scoreArticle(article: Article): number {
  const now = new Date().getTime();
  let score = 0;

  // 1. Recency (Highest importance: fresh news leads)
  // 100 points max, loses ~2 points per hour, hitting 0 after ~48 hours
  const ageInHours = (now - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 100 - (ageInHours * 2.1));

  // 2. Depth & Complexity (Favors highly synthesized reporting)
  score += (article.readTime || 0) * 4;

  // 3. Structural Substance (Favors deeply fleshed out articles)
  if (article.body && article.body.length >= 8) score += 10;
  if (article.body && article.body.length >= 10) score += 5;
  if (article.body && article.body.length >= 12) score += 5;

  // 4. Category Authority (Editorial precedence for "Front Page" topics)
  if (article.category === 'GEOPOLITICS') score += 8;
  if (article.category === 'FINANCE') score += 6;
  if (article.category === 'TECHNOLOGY') score += 4;

  // 5. Source Diversity Bonus (Multiple sources = stronger reporting)
  const sourceCount = article.sources?.length || 0;
  if (sourceCount >= 3) score += 8;
  if (sourceCount >= 5) score += 4;

  // 6. Quote Detection Bonus (Articles with quotes feel more authoritative)
  const bodyText = (article.body || []).join(' ');
  const quoteCount = (bodyText.match(/[""].*?[""]|".*?"/g) || []).length;
  if (quoteCount >= 2) score += 6;
  if (quoteCount >= 4) score += 4;

  // 7. Headline Quality Bonus (Longer, more specific headlines tend to be better)
  const headlineWords = article.headline.split(' ').length;
  if (headlineWords >= 6 && headlineWords <= 12) score += 4;

  return score;
}

/**
 * Get the featured article — the single highest-scoring article across all categories.
 */
export function getFeaturedArticle(): Article | undefined {
  if (articles.length === 0) return undefined;

  const scoredArticles = articles.map(article => ({
    article,
    score: scoreArticle(article),
  }));

  scoredArticles.sort((a, b) => b.score - a.score);

  const featured = scoredArticles[0].article;
  featured.featured = true;
  featured.exclusive = true; // Featured is always exclusive
  return featured;
}

/**
 * Get exclusive articles — the best story from each of the 6 categories.
 * Returns 6 articles total (1 per category), all marked as exclusive.
 * The featured article is always included.
 */
export function getExclusiveArticles(): Article[] {
  if (articles.length === 0) return [];

  const categories: Category[] = ['TECHNOLOGY', 'GEOPOLITICS', 'CLIMATE', 'FINANCE', 'HEALTH', 'CULTURE'];
  const exclusive: Article[] = [];

  for (const category of categories) {
    const categoryArticles = articles.filter(a => a.category === category);
    if (categoryArticles.length === 0) continue;

    // Score and sort within category
    const scored = categoryArticles.map(article => ({
      article,
      score: scoreArticle(article),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Take the top article from this category
    const best = scored[0].article;
    best.exclusive = true;
    exclusive.push(best);
  }

  // Sort exclusive articles by score descending (best first)
  exclusive.sort((a, b) => scoreArticle(b) - scoreArticle(a));

  return exclusive;
}

/**
 * Check if an article is exclusive (by slug).
 */
export function isArticleExclusive(slug: string): boolean {
  const exclusives = getExclusiveArticles();
  return exclusives.some(a => a.slug === slug);
}

export function getLatestArticles(count?: number): Article[] {
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return count ? sorted.slice(0, count) : sorted;
}
