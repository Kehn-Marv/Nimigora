import { Category } from './types';

export interface RSSSource {
  name: string;
  url: string;
  category: Category;
  reliability: 'high' | 'medium';
}

/**
 * RSS Source Registry
 * Primary backbone for news discovery — unlimited, free, reliable.
 * Google News RSS by category + direct publication feeds.
 */
export const RSS_SOURCES: RSSSource[] = [
  // ============== TECHNOLOGY ==============
  {
    name: 'Google News — Technology',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'Hacker News (Best)',
    url: 'https://hnrss.org/best',
    category: 'TECHNOLOGY',
    reliability: 'medium',
  },
  {
    name: 'Google News — Science',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'Science Daily',
    url: 'https://www.sciencedaily.com/rss/all.xml',
    category: 'TECHNOLOGY',
    reliability: 'medium',
  },
  {
    name: 'Nature News',
    url: 'https://www.nature.com/nature.rss',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },

  // ============== GEOPOLITICS ==============
  {
    name: 'Google News — World',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'The Guardian — World',
    url: 'https://www.theguardian.com/world/rss',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'Foreign Policy',
    url: 'https://foreignpolicy.com/feed/',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'The Diplomat',
    url: 'https://thediplomat.com/feed/',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'BBC News — World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'Reuters — World',
    url: 'https://www.reutersagency.com/feed/',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'DW News',
    url: 'https://rss.dw.com/rdf/rss-en-all',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'France 24',
    url: 'https://www.france24.com/en/rss',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'South China Morning Post',
    url: 'https://www.scmp.com/rss/91/feed',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },

  // ============== CLIMATE ==============
  {
    name: 'Google News — Environment',
    url: 'https://news.google.com/rss/search?q=climate+change+environment&hl=en&gl=world&ceid=US:en',
    category: 'CLIMATE',
    reliability: 'high',
  },
  {
    name: 'Carbon Brief',
    url: 'https://www.carbonbrief.org/feed/',
    category: 'CLIMATE',
    reliability: 'high',
  },
  {
    name: 'Inside Climate News',
    url: 'https://insideclimatenews.org/feed/',
    category: 'CLIMATE',
    reliability: 'high',
  },
  {
    name: 'The Guardian — Environment',
    url: 'https://www.theguardian.com/environment/rss',
    category: 'CLIMATE',
    reliability: 'high',
  },
  {
    name: 'EcoWatch',
    url: 'https://www.ecowatch.com/feed/',
    category: 'CLIMATE',
    reliability: 'medium',
  },
  {
    name: 'Yale Climate Connections',
    url: 'https://yaleclimateconnections.org/feed/',
    category: 'CLIMATE',
    reliability: 'high',
  },
  {
    name: 'Devex',
    url: 'https://www.devex.com/news/rss',
    category: 'CLIMATE',
    reliability: 'high',
  },

  // ============== FINANCE ==============
  {
    name: 'Google News — Business',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'MarketWatch',
    url: 'https://feeds.marketwatch.com/marketwatch/topstories/',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'Wall Street Journal — World News',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    category: 'FINANCE',
    reliability: 'medium',
  },
  {
    name: 'CNBC',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'Forbes — Business',
    url: 'https://www.forbes.com/business/feed/',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'The Economist — Business',
    url: 'https://www.economist.com/business/rss.xml',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'Financial Times',
    url: 'https://www.ft.com/rss/home',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'Nikkei Asia',
    url: 'https://asia.nikkei.com/rss',
    category: 'FINANCE',
    reliability: 'high',
  },

  // ============== HEALTH ==============
  {
    name: 'Google News — Health',
    url: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ',
    category: 'HEALTH',
    reliability: 'high',
  },
  {
    name: 'STAT News',
    url: 'https://www.statnews.com/feed/',
    category: 'HEALTH',
    reliability: 'high',
  },
  {
    name: 'WHO News',
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    category: 'HEALTH',
    reliability: 'high',
  },
  {
    name: 'Medical News Today',
    url: 'https://www.medicalnewstoday.com/rss/medicalnews.xml',
    category: 'HEALTH',
    reliability: 'medium',
  },
  {
    name: 'NPR — Health',
    url: 'https://feeds.npr.org/1128/rss.xml',
    category: 'HEALTH',
    reliability: 'high',
  },
  {
    name: 'The Lancet',
    url: 'https://www.thelancet.com/rssfeed/lancet_online.xml',
    category: 'HEALTH',
    reliability: 'high',
  },

  // ============== CULTURE ==============
  {
    name: 'Google News — Entertainment',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'The Guardian — Culture',
    url: 'https://www.theguardian.com/culture/rss',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'Variety',
    url: 'https://variety.com/feed/',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'Rolling Stone',
    url: 'https://www.rollingstone.com/feed/',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'Pitchfork',
    url: 'https://pitchfork.com/feed/feed-news/rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'NPR — Arts & Life',
    url: 'https://feeds.npr.org/1008/rss.xml',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'IndieWire',
    url: 'https://www.indiewire.com/feed/',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'The Africa Report',
    url: 'https://www.theafricareport.com/feed/',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'TMZ',
    url: 'https://www.tmz.com/rss.xml',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'BuzzFeed',
    url: 'https://www.buzzfeed.com/world.xml',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'Vice',
    url: 'https://www.vice.com/en/rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'People Magazine',
    url: 'https://people.com/feed/',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'The Daily Beast',
    url: 'https://feeds.thedailybeast.com/rss/articles',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'Daily Mail — News',
    url: 'https://www.dailymail.co.uk/articles.rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'Reddit — Popular',
    url: 'https://www.reddit.com/r/popular.rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'Dazed',
    url: 'https://www.dazeddigital.com/rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'Vogue',
    url: 'https://www.vogue.com/feed/rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'The A.V. Club',
    url: 'https://www.avclub.com/rss',
    category: 'CULTURE',
    reliability: 'high',
  },
  {
    name: 'Polygon',
    url: 'https://www.polygon.com/rss/index.xml',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'Engadget',
    url: 'https://www.engadget.com/rss.xml',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'Gizmodo',
    url: 'https://gizmodo.com/rss',
    category: 'TECHNOLOGY',
    reliability: 'medium',
  },
  {
    name: 'TechRadar',
    url: 'https://www.techradar.com/rss',
    category: 'TECHNOLOGY',
    reliability: 'medium',
  },
  {
    name: 'Space.com',
    url: 'https://www.space.com/feeds/all',
    category: 'TECHNOLOGY',
    reliability: 'high',
  },
  {
    name: 'The Independent — World',
    url: 'https://www.independent.co.uk/news/world/rss',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'Council on Foreign Relations',
    url: 'https://www.cfr.org/rss.xml',
    category: 'GEOPOLITICS',
    reliability: 'high',
  },
  {
    name: 'Grist',
    url: 'https://grist.org/feed/',
    category: 'CLIMATE',
    reliability: 'high',
  },
  {
    name: 'Earth911',
    url: 'https://earth911.com/feed/',
    category: 'CLIMATE',
    reliability: 'medium',
  },
  {
    name: 'Bloomberg — Markets',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'FINANCE',
    reliability: 'high',
  },
  {
    name: 'Financial Post',
    url: 'https://financialpost.com/feed',
    category: 'FINANCE',
    reliability: 'medium',
  },
  {
    name: 'Kaiser Health News',
    url: 'https://khn.org/feed/',
    category: 'HEALTH',
    reliability: 'high',
  },
  {
    name: 'MedPage Today',
    url: 'https://www.medpagetoday.com/rss/headlines.xml',
    category: 'HEALTH',
    reliability: 'high',
  },
  {
    name: 'GQ',
    url: 'https://www.gq.com/feed/rss',
    category: 'CULTURE',
    reliability: 'medium',
  },
  {
    name: 'Vulture',
    url: 'https://www.vulture.com/feed.xml',
    category: 'CULTURE',
    reliability: 'high',
  }
];

export function getSourcesByCategory(category: Category): RSSSource[] {
  return RSS_SOURCES.filter((s) => s.category === category);
}

export function getAllCategories(): Category[] {
  return ['TECHNOLOGY', 'GEOPOLITICS', 'CLIMATE', 'FINANCE', 'HEALTH', 'CULTURE'];
}
