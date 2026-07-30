'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { useNimiq } from './NimiqProvider';
import PaywallModal from './PaywallModal';
import BookmarkButton from './BookmarkButton';
import { LockKeyhole, Flash, Globe, Leaf, ChartLine, Activity, Sparkles, Clock } from 'reicon-react';

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

interface ExclusiveListItemProps {
  article: Article;
}

export default function ExclusiveListItem({ article }: ExclusiveListItemProps) {
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
      <div className="article-list-item-wrapper exclusive-list-item-wrapper">
        <Link 
          href={`/article/${article.slug}`} 
          className="article-list-item exclusive-list-item" 
          id={`list-${article.slug}`}
          onClick={handleClick}
        >
          {/* Padlock overlay */}
          {!isSubscribed && (
            <div className="exclusive-lock-overlay">
              <div className="exclusive-lock-icon">
                <LockKeyhole size={24} strokeWidth={3} />
              </div>
            </div>
          )}

          <div className="article-list-avatar" style={{
            background: `var(--color-black)`, // Override for exclusive
            color: 'var(--color-accent)', // Gold icon
            border: '1px solid var(--color-accent)'
          }}>
            {CATEGORY_ICONS[article.category]}
          </div>
          
          <div className="article-list-content">
            <div className="article-list-badges">
              <span className={getCategoryBadgeClass(article.category)} style={{ padding: '1px 6px', fontSize: '9px', background: 'var(--color-black)', color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
                {article.category}
              </span>
            </div>
            <h4 className="article-list-headline" style={{ color: 'var(--color-white)' }}>{article.headline}</h4>
            <p className="article-list-deck" style={{ color: 'rgba(255,255,255,0.7)' }}>{article.deck}</p>
            <div className="article-list-meta" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {formatDate(article.publishedAt)}</span>
            </div>
          </div>
        </Link>
        <BookmarkButton slug={article.slug} size={16} className="article-list-bookmark" isExclusive={true} />
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSuccess={() => setShowPaywall(false)}
      />
    </>
  );
}
