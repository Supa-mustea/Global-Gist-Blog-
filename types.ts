export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Author {
  name: string;
  bio: string;
  avatarUrl: string;
}

export interface BlogPost {
  id: string;
  topic: string;
  title: string;
  summary: string;
  content: string; // Markdown content
  imageUrl: string;
  imageDescription?: string;
  sources: GroundingSource[];
  author: Author;
  commentCount?: number;
  youtubeVideoId?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  text: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}