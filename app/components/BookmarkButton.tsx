'use client';

import { useState, useEffect } from 'react';
import { toggleBookmark, isBookmarked } from '@/lib/bookmarks';
import { Bookmark } from 'lucide-react';
import { useNimiq } from './NimiqProvider';

interface BookmarkButtonProps {
  slug: string;
  size?: number;
  className?: string;
  isExclusive?: boolean;
}

export default function BookmarkButton({ slug, size = 18, className = '', isExclusive = false }: BookmarkButtonProps) {
  const { isSubscribed } = useNimiq();
  const [bookmarked, setBookmarked] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(slug));
    setMounted(true);
  }, [slug]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = toggleBookmark(slug);
    setBookmarked(newState);
    
    // Dispatch a custom event so the Bookmarks page instantly updates
    window.dispatchEvent(new Event('bookmarksUpdated'));
    
    if (newState) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
  };

  if (isExclusive && !isSubscribed) {
    return null;
  }

  return (
    <button
      className={`bookmark-btn ${bookmarked ? 'bookmarked' : ''} ${animating ? 'animating' : ''} ${className}`}
      onClick={handleClick}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
    >
      <Bookmark size={size} fill={bookmarked ? 'currentColor' : 'none'} />
    </button>
  );
}
