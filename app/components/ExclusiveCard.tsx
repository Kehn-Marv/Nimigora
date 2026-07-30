'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { useNimiq } from './NimiqProvider';
import PaywallModal from './PaywallModal';
import BookmarkButton from './BookmarkButton';
import { LockKeyhole, Flash, Globe, Leaf, ChartLine, Activity, Sparkles } from 'reicon-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  TECHNOLOGY: <Flash size={14} />,
  GEOPOLITICS: <Globe size={14} />,
  CLIMATE: <Leaf size={14} />,
  FINANCE: <ChartLine size={14} />,
  HEALTH: <Activity size={14} />,
  CULTURE: <Sparkles size={14} />,
};

function getCategoryBadgeClass(category: string): string {
  return `badge badge-${category.toLowerCase()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface ExclusiveCardProps {
  article: Article;
}

export default function ExclusiveCard({ article }: ExclusiveCardProps) {
  const { isSubscribed } = useNimiq();
  const [showPaywall, setShowPaywall] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!isSubscribed) {
      e.preventDefault();
      setShowPaywall(true);
    }
  };

  return (
    <>
      <Link 
        href={`/article/${article.slug}`} 
        className="exclusive-card" 
        id={`exclusive-${article.slug}`}
        onClick={handleClick}
      >
        {/* Padlock overlay */}
        {!isSubscribed && (
          <div className="exclusive-lock-overlay">
            <div className="exclusive-lock-icon">
              <LockKeyhole size={32} strokeWidth={3} />
            </div>
          </div>
        )}

        <div className="exclusive-card-body">
          <div className="exclusive-card-meta">
            <span className={getCategoryBadgeClass(article.category)} style={{ padding: '2px 8px', fontSize: '10px' }}>
              {article.category}
            </span>
            <span>{article.readTime} min read</span>
          </div>
          <h3 className="exclusive-card-headline">{article.headline}</h3>
          <p className="exclusive-card-deck">{article.deck}</p>
          <div className="exclusive-card-footer">
            <span>{formatDate(article.publishedAt)}</span>
            {isSubscribed && <BookmarkButton slug={article.slug} size={16} />}
          </div>
        </div>
      </Link>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
      />
    </>
  );
}
