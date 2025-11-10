import React from 'react';
import { BlogPost } from '../types';

interface BlogCardProps {
  post: BlogPost;
  onReadMore: () => void;
}

export const BlogCard: React.FC<BlogCardProps> = ({ post, onReadMore }) => (
  <div className="bg-secondary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col">
    <img className="w-full h-56 object-cover" src={post.imageUrl} alt={post.title} />
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-xl font-bold mb-2 text-text-primary">{post.title}</h3>
      <p className="text-text-secondary text-sm mb-4 flex-grow">{post.summary}</p>
      <div className="mt-auto">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>
          <span>{post.commentCount ?? 0} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        <button
          onClick={onReadMore}
          className="w-full bg-accent hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Read More
        </button>
      </div>
    </div>
  </div>
);