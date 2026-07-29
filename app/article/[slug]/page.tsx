import { getArticleBySlug, getLatestArticles, isArticleExclusive } from '@/lib/articles';
import { notFound } from 'next/navigation';
import { ArticleCard } from '@/app/components/ArticleCards';
import { PipelineDropdown } from '@/app/components/PipelineDropdown';
import ArticleContent from './ArticleContent';
import { Paperclip } from 'reicon-react';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Article Not Found' };
  return {
    title: `${article.headline} Nimigora`,
    description: article.deck,
  };
}

export async function generateStaticParams() {
  const articles = getLatestArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getCategoryBadgeClass(category: string): string {
  return `badge badge-${category.toLowerCase()}`;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const isExclusive = isArticleExclusive(slug);

  const related = getLatestArticles()
    .filter((a) => a.slug !== article.slug)
    .slice(0, 3);

  return (
    <>
      <article className="article-page" id="article-page">
        {/* Header */}
        <header className="article-page-header">
          <div className="article-page-category" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={getCategoryBadgeClass(article.category)}>
              {article.category}
            </span>
            {isExclusive && (
              <span className="badge badge-premium" style={{ padding: '2px 10px', fontSize: '10px' }}>
                ★ EXCLUSIVE
              </span>
            )}
          </div>

          <h1 className="article-page-headline">{article.headline}</h1>

          <p className="article-page-deck">{article.deck}</p>

          <div className="article-page-meta">
            <span>
              <strong>Nimigora AI</strong>
            </span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>{article.readTime} min read</span>
          </div>
        </header>

        {/* Pipeline Transparency */}
        {article.pipelineSteps && (
          <PipelineDropdown steps={article.pipelineSteps} />
        )}

        {/* Article Body with subscription gate for exclusive content */}
        <ArticleContent 
          body={article.body} 
          slug={article.slug}
          isExclusive={isExclusive} 
        />

        {/* Sources */}
        <div className="sources-box" id="article-sources">
          <h3 className="sources-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Paperclip size={20} /> Sources Referenced
          </h3>
          <ul className="sources-list">
            {article.sources.map((source, i) => (
              <li key={i}>{source}</li>
            ))}
          </ul>
        </div>
      </article>

      <hr className="divider" />

      {/* Related Stories */}
      <section className="section" id="related-stories">
        <div className="section-header">
          <h2 className="section-title" style={{ fontSize: '28px' }}>
            More Stories
          </h2>
        </div>
        <div className="article-grid">
          {related.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>
    </>
  );
}
