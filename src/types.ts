export interface Article {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  source: string;
  country: string;
  color: string;
  category?: string;
}

export interface NewsResponse {
  articles: Article[];
  fetched_at: string;
  total: number;
}
