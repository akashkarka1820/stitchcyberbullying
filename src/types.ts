export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  strikes: number;
  status: 'active' | 'restricted' | 'banned';
  joined_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  content: string;
  image_url: string;
  location: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface Violation {
  id: number;
  user_id: number;
  type: string;
  content_preview: string;
  timestamp: string;
}
