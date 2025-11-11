import { BlogPost, Comment } from '../types';

/**
 * A generic function to call our secure backend proxy.
 * @param action The specific API action to perform (e.g., 'getPosts').
 * @param payload The data required for that action.
 * @returns The JSON response from the proxy.
 */
const callApiProxy = async (action: string, payload: object = {}) => {
  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: `Failed to call API proxy for action: ${action}` }));
      // If running on localhost, return a safe fallback instead of throwing
      if (isLocalhost) return handleFallback(action, payload);
      throw new Error(errorBody.error || 'An unknown API error occurred.');
    }

    return response.json();
  } catch (err) {
    // Network or other error reaching the dev API — provide a local fallback
    if (isLocalhost) return handleFallback(action, payload);
    // Re-throw so callers handle production errors normally
    throw err;
  }
};

// --- Local development fallback ---
// If the frontend cannot reach the local API (e.g., you haven't started the
// dev API server or are missing env vars), show safe sample data so the UI
// remains usable during development. This fallback only triggers on localhost.
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const samplePost = {
  id: 'sample-1',
  topic: 'Sample Topic',
  title: 'Welcome to Global Gist — Sample Article',
  summary: 'This is a locally generated sample article to help with UI development when the backend is unavailable.',
  content: '<p>This is sample content. Replace with real posts when the backend is running.</p>',
  imageUrl: 'https://picsum.photos/seed/sample/600/400',
  imageDescription: 'Sample image',
  sources: [],
  author: { name: 'Global Gist', bio: '', avatarUrl: '' },
  created_at: new Date().toISOString(),
};

const samplePosts = [samplePost];

// Helper to return fallback values for common actions
const handleFallback = (action: string, payload: any) => {
  if (!isLocalhost) throw new Error(`API proxy failed for action: ${action}`);

  switch (action) {
    case 'getPosts':
      return samplePosts;
    case 'getAllPosts':
      return samplePosts.map(p => ({ post: { id: p.id, title: p.title, topic: p.topic }, topic: p.topic }));
    case 'getPostById':
      return samplePosts[0] || null;
    case 'searchAndGeneratePost':
      return samplePosts[0] || null;
    default:
      throw new Error(`API proxy failed for action: ${action}`);
  }
};

const POSTS_PER_PAGE = 9;

// --- Post Fetching ---
export const fetchPostsForTopic = (topic: string, page: number): Promise<BlogPost[]> => {
  return callApiProxy('getPosts', { topic, page, limit: POSTS_PER_PAGE });
};

export const fetchPostById = (postId: string): Promise<BlogPost | null> => {
  return callApiProxy('getPostById', { postId });
};

export const fetchAllPosts = (): Promise<{ post: BlogPost; topic: string }[]> => {
    return callApiProxy('getAllPosts');
};

export const searchAndGeneratePost = (topic: string): Promise<BlogPost | null> => {
    return callApiProxy('searchAndGeneratePost', { topic });
};

export const fetchRelatedPosts = (keywords: string[], currentPostId: string): Promise<BlogPost[]> => {
    return callApiProxy('getRelatedPosts', { keywords, currentPostId });
};

// --- Post Management (Admin) ---
export const createPost = (post: Omit<BlogPost, 'id' | 'created_at' | 'sources' | 'author' | 'commentCount'>): Promise<BlogPost> => {
    return callApiProxy('createPost', { post });
};

export const updatePost = (post: BlogPost): Promise<BlogPost> => {
    return callApiProxy('updatePost', { post });
};

export const deletePost = (postId: string): Promise<{ success: boolean }> => {
    return callApiProxy('deletePost', { postId });
};


// --- Comment Management ---
export const fetchCommentsForPost = (postId: string): Promise<Comment[]> => {
    return callApiProxy('getComments', { postId });
};

export const fetchAllComments = (): Promise<Comment[]> => {
    return callApiProxy('getAllComments');
};

export const addComment = (comment: Omit<Comment, 'id' | 'created_at' | 'timestamp'>): Promise<Comment> => {
    return callApiProxy('addComment', { comment });
};

export const updateCommentStatus = (commentId: string, status: Comment['status']): Promise<Comment> => {
    return callApiProxy('updateCommentStatus', { commentId, status });
};


// --- Other Gemini Services ---
export const findYouTubeVideoId = (query: string): Promise<string | null> => {
  return callApiProxy('findYouTubeVideoId', { query });
};

export const extractKeywordsFromContent = (content: string): Promise<string[]> => {
  return callApiProxy('extractKeywordsFromContent', { content });
};