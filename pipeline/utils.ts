/**
 * Pipeline Utilities
 *
 * Slug generation, readability scoring, date helpers,
 * and filesystem operations for the content directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Article } from '@/lib/types';

// ============================================
// Paths
// ============================================

export const CONTENT_DIR = path.join(process.cwd(), 'content', 'articles');

/**
 * Ensure the content directory exists.
 */
export function ensureContentDir(): void {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
}

// ============================================
// Slug Generation
// ============================================

/**
 * Generate a URL-safe slug from a headline.
 */
export function generateSlug(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
}

// ============================================
// Readability Scoring
// ============================================

/**
 * Calculate Flesch-Kincaid Grade Level.
 * Target for Nimigora: 12–14 (college-level journalism).
 */
export function fleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  return 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;

  // Adjust for silent e
  if (word.endsWith('e') && !word.endsWith('le')) {
    count = Math.max(1, count - 1);
  }

  return Math.max(1, count);
}

// ============================================
// Read Time
// ============================================

/**
 * Estimate read time in minutes from word count.
 * Average reading speed: ~230 words per minute.
 */
export function calculateReadTime(bodyParagraphs: string[]): number {
  const text = bodyParagraphs.join(' ');
  const totalWords = text.split(/\s+/).length;
  // Complex journalism is read slightly slower (around 200 wpm)
  // Plus we add a baseline 1 minute for headline, deck, and cognitive load
  const rawMinutes = (totalWords / 200) + 1;
  return Math.max(1, Math.ceil(rawMinutes));
}

// ============================================
// Date Helpers
// ============================================

/**
 * Get current timestamp in ISO format.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Check if a date string is within the last N days.
 */
export function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

// ============================================
// File Operations
// ============================================

/**
 * Save an article as a JSON file in the content directory.
 */
export function saveArticle(article: Article): void {
  ensureContentDir();
  const filePath = path.join(CONTENT_DIR, `${article.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(article, null, 2), 'utf-8');
  console.log(`  💾 Saved: ${article.slug}`);
}

/**
 * Load all articles from the content directory.
 */
export function loadAllArticles(): Article[] {
  ensureContentDir();
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
  const articles: Article[] = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
      articles.push(JSON.parse(raw) as Article);
    } catch (error) {
      console.warn(`  ⚠ Failed to read ${file}: ${(error as Error).message}`);
    }
  }

  return articles;
}

/**
 * Get all existing article slugs to avoid duplicates.
 */
export function getExistingSlugs(): Set<string> {
  ensureContentDir();
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
  return new Set(files.map((f) => f.replace('.json', '')));
}

/**
 * Get all raw source URLs from existing articles to prevent identical story regeneration.
 */
export function getExistingSourceUrls(): Set<string> {
  const articles = loadAllArticles();
  const urls = new Set<string>();
  for (const article of articles) {
    if (article.sourceUrls) {
      for (const url of article.sourceUrls) {
        urls.add(url);
      }
    } else if (article.sources) {
      // Fallback for older articles
      for (const src of article.sources) {
        if (src.startsWith('http')) urls.add(src);
      }
    }
  }
  return urls;
}

/**
 * Prune articles older than N days (preserves founding articles).
 */
export function pruneOldArticles(retentionDays: number = 30): number {
  ensureContentDir();
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'));
  let pruned = 0;

  for (const file of files) {
    try {
      const filePath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const article = JSON.parse(raw) as Article & { founding?: boolean };

      // Never prune founding articles
      if (article.founding) continue;

      if (!isWithinDays(article.publishedAt, retentionDays)) {
        fs.unlinkSync(filePath);
        console.log(`  🗑 Pruned: ${article.slug}`);
        pruned++;
      }
    } catch (error) {
      console.warn(`  ⚠ Prune error for ${file}: ${(error as Error).message}`);
    }
  }

  return pruned;
}
