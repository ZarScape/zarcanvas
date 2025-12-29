export interface FontOptions {
  name: string;
  path?: string;
}

export type Theme = 'dark' | 'light' | 'dim';

export interface CardStats {
  replies: string | number;
  retweets: string | number;
  likes: string | number;
  views: string | number;
}