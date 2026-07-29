/**
 * Bookmark System
 * 
 * Manages article bookmarks using localStorage.
 * Twitter-style save/unsave with toggle support.
 */

// ============================================
// Constants
// ============================================

const STORAGE_KEY = 'nimigora_bookmarks';

// ============================================
// Core Functions
// ============================================

/**
 * Get all bookmarked article slugs.
 */
export function getBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    
    const bookmarks = JSON.parse(raw);
    return Array.isArray(bookmarks) ? bookmarks : [];
  } catch {
    return [];
  }
}

/**
 * Add an article to bookmarks.
 */
export function addBookmark(slug: string): void {
  if (typeof window === 'undefined') return;
  
  const bookmarks = getBookmarks();
  if (!bookmarks.includes(slug)) {
    bookmarks.push(slug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }
}

/**
 * Remove an article from bookmarks.
 */
export function removeBookmark(slug: string): void {
  if (typeof window === 'undefined') return;
  
  const bookmarks = getBookmarks().filter(s => s !== slug);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

/**
 * Check if an article is bookmarked.
 */
export function isBookmarked(slug: string): boolean {
  return getBookmarks().includes(slug);
}

/**
 * Toggle bookmark status. Returns new bookmarked state.
 */
export function toggleBookmark(slug: string): boolean {
  if (isBookmarked(slug)) {
    removeBookmark(slug);
    return false;
  } else {
    addBookmark(slug);
    return true;
  }
}

/**
 * Get the total number of bookmarks.
 */
export function getBookmarkCount(): number {
  return getBookmarks().length;
}

/**
 * Clear all bookmarks.
 */
export function clearAllBookmarks(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
