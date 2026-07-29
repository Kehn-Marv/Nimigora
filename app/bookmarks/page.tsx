import { articles } from '@/lib/articles';
import BookmarksClient from './BookmarksClient';

export default function BookmarksPage() {
  const articleCategories = articles.reduce((acc, a) => {
    acc[a.slug] = a.category;
    return acc;
  }, {} as Record<string, string>);

  return <BookmarksClient articleCategories={articleCategories} />;
}
