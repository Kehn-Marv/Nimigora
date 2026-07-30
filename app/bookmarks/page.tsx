import { articles } from '@/lib/articles';
import BookmarksClient from './BookmarksClient';

export default function BookmarksPage() {
  const articleCategories = articles.reduce((acc, a) => {
    acc[a.slug] = a.category;
    return acc;
  }, {} as Record<string, string>);

  const articleExclusivity = articles.reduce((acc, a) => {
    acc[a.slug] = !!a.exclusive;
    return acc;
  }, {} as Record<string, boolean>);

  return <BookmarksClient articleCategories={articleCategories} articleExclusivity={articleExclusivity} />;
}
