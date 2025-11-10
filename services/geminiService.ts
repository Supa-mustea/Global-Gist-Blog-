import { BlogPost, Comment } from '../types';

/**
 * A generic function to call our secure backend proxy.
 * @param action The specific API action to perform (e.g., 'getPosts').
 * @param payload The data required for that action.
 * @returns The JSON response from the proxy.
 */
const callApiProxy = async (action: string, payload: object = {}) => {
  const response = await fetch('/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `Failed to call API proxy for action: ${action}` }));
    throw new Error(errorBody.error || 'An unknown API error occurred.');
  }

  return response.json();
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