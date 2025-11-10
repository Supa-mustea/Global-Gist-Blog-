import React, { useState, useEffect } from 'react';
import { BlogPost, Comment } from '../types';
import { BlogCard } from './BlogCard';

interface SavedPostsViewProps {
  onSelectPost: (post: BlogPost) => void;
  onBack: () => void;
}

interface SavedPostCardProps {
  post: BlogPost;
  onReadMore: () => void;
  onRemove: () => void;
}

const SavedPostCard: React.FC<SavedPostCardProps> = ({ post, onReadMore, onRemove }) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onReadMore from firing
    onRemove();
  };
  
  return (
    <div className="relative group">
      <BlogCard post={post} onReadMore={onReadMore} />
      <button
        onClick={handleRemove}
        aria-label={`Remove ${post.title} from saved posts`}
        className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-500 text-white rounded-full h-8 w-8 flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
      </button>
    </div>
  );
}


export const SavedPostsView: React.FC<SavedPostsViewProps> = ({ onSelectPost, onBack }) => {
  const [savedPosts, setSavedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    try {
      const postsFromStorage: BlogPost[] = JSON.parse(localStorage.getItem('globalGistSavedPosts') || '[]');
      
      const allComments: Comment[] = JSON.parse(localStorage.getItem('globalGistComments') || '[]');
      const approvedComments = allComments.filter(c => c.status === 'approved' || !c.status);
      const counts = new Map<string, number>();
      approvedComments.forEach(comment => {
          counts.set(comment.postId, (counts.get(comment.postId) || 0) + 1);
      });

      const postsWithCounts = postsFromStorage.map(post => ({
          ...post,
          commentCount: counts.get(post.id) || 0
      }));

      setSavedPosts(postsWithCounts);
    } catch (error) {
      console.error("Failed to load saved posts from localStorage:", error);
      setSavedPosts([]);
    }
  }, []);

  const handleRemovePost = (postId: string) => {
    const updatedPosts = savedPosts.filter(p => p.id !== postId);
    localStorage.setItem('globalGistSavedPosts', JSON.stringify(updatedPosts));
    setSavedPosts(updatedPosts);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <button
          onClick={onBack}
          className="mb-6 bg-secondary hover:bg-white/10 text-text-primary font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          &larr; Back to Main Blog
        </button>
        <h1 className="text-3xl font-black tracking-tighter">Your Saved Posts</h1>
        <p className="text-text-secondary mt-1">Here are the articles you saved for later.</p>
      </div>

      {savedPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {savedPosts.map((post) => (
            <SavedPostCard
              key={post.id}
              post={post}
              onReadMore={() => onSelectPost(post)}
              onRemove={() => handleRemovePost(post.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-secondary rounded-lg">
          <h2 className="text-2xl font-bold text-text-primary">Your Reading List is Empty</h2>
          <p className="text-text-secondary mt-2">Find an article you like and click "Save for Later" to save it here.</p>
        </div>
      )}
    </div>
  );
};