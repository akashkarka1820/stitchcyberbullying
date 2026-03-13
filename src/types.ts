export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  strikes: number;
  status: 'active' | 'restricted' | 'banned';
  joined_at: string;
  blocked_until?: string;
  violation_count?: number;
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

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  username: string;
  full_name: string;
  content: string;
  is_flagged: boolean;
  confidence: number;
  bullying_type: string;
  created_at: string;
}

export interface Violation {
  id: number;
  user_id: number;
  username?: string;
  full_name?: string;
  type: string;
  content_preview: string;
  timestamp: string;
  action_taken?: string;
  confidence?: number;
}
