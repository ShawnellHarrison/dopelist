export interface City {
  id: string;
  name: string;
  slug: string;
  type: string;
  parent_id: string | null;
  craigslist_supported: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  section: string;
  name: string;
  slug: string;
  icon: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  city_id: string;
  category_id: string;
  title: string;
  description: string;
  price: string | null;
  location: string;
  images: string[];
  contact_email: string | null;
  stripe_payment_id: string;
  stripe_session_id?: string;
  votes: number;
  reactions: {
    hot: number;
    interested: number;
    watching: number;
    question: number;
    deal: number;
  };
  created_at: string;
  expires_at: string;
  comments_close_at?: string;
  is_active: boolean;
}

export interface PostWithDetails extends Post {
  city?: City;
  category?: Category;
}

export type Section = 'community' | 'for_sale' | 'housing' | 'jobs' | 'services' | 'gigs' | 'discussion' | 'events' | 'resumes';

export interface SectionInfo {
  id: Section;
  name: string;
  emoji: string;
  color: string;
}
