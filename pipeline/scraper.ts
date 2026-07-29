/**
 * Web Content Extractor
 *
 * Extracts readable article text from web pages using cheerio.
 * Gracefully handles failures — returns RSS summary as fallback.
 */

import * as cheerio from 'cheerio';

// ============================================
// Types
// ============================================

export interface ScrapedContent {
  title: string;
  text: string;
  url: string;
  success: boolean;
}

// ============================================
// Scraper
// ============================================

/**
 * Extract article text from a URL.
 * Uses a readability-style approach: find the main content block,
 * strip navigation/ads/scripts, return clean text.
 *
 * Returns fallback text on any failure.
 */
export async function extractArticleText(
  url: string,
  fallbackText: string = ''
): Promise<ScrapedContent> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Nimigora-Pipeline/1.0; +https://nimigora.ai)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { title: '', text: fallbackText, url, success: false };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .ad, .sidebar, .comments, .related, .social, [role="navigation"], [role="banner"]').remove();

    // Try to find the main content area
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      '';

    // Look for article body in priority order
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.article-body',
      '.post-content',
      '.entry-content',
      '.story-body',
      '.article-content',
      'main',
      '.content',
    ];

    let articleText = '';

    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        articleText = el
          .find('p')
          .map((_, p) => $(p).text().trim())
          .get()
          .filter((t) => t.length > 30) // Filter out short nav snippets
          .join('\n\n');

        if (articleText.length > 200) break;
      }
    }

    // Fallback: just grab all <p> tags
    if (articleText.length < 200) {
      articleText = $('p')
        .map((_, p) => $(p).text().trim())
        .get()
        .filter((t) => t.length > 30)
        .join('\n\n');
    }

    // Truncate to first ~3000 chars to stay within token limits
    const truncated = articleText.substring(0, 3000);

    return {
      title: title.trim(),
      text: truncated || fallbackText,
      url,
      success: truncated.length > 100,
    };
  } catch (error) {
    console.warn(`  ✗ Scrape failed for ${url}: ${(error as Error).message}`);
    return { title: '', text: fallbackText, url, success: false };
  }
}

/**
 * Batch scrape multiple URLs with concurrency limit.
 */
export async function batchScrape(
  urls: { url: string; fallbackText: string }[],
  concurrency: number = 3
): Promise<ScrapedContent[]> {
  const results: ScrapedContent[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((item) => extractArticleText(item.url, item.fallbackText))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          title: '',
          text: batch[results.length % batch.length]?.fallbackText || '',
          url: '',
          success: false,
        });
      }
    }
  }

  return results;
}
