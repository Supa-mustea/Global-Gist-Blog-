import React from 'react';
import { BlogPost } from '../types';

interface FeaturedBlogCardProps {
  post: BlogPost;
  onReadMore: () => void;
}

const FeaturedBlogCard: React.FC<FeaturedBlogCardProps> = ({ post, onReadMore }) => (
  <div 
    className="bg-secondary rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col h-full group cursor-pointer"
    onClick={onReadMore}
    role="button"
    tabIndex={0}
    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onReadMore()}
  >
    <div className="relative">
      <img className="w-full h-56 object-cover" src={post.imageUrl} alt={post.title} />
       <div className="absolute top-3 left-3 bg-accent/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md">
        Featured
      </div>
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-xl font-bold mb-2 text-text-primary group-hover:text-accent transition-colors duration-200">{post.title}</h3>
      <p className="text-text-secondary text-sm mb-4 flex-grow line-clamp-3">{post.summary}</p>
      <div className="mt-auto">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>
            <span>{post.commentCount ?? 0} {post.commentCount === 1 ? 'Comment' : 'Comments'}</span>
        </div>
        <span
          className="text-accent font-bold text-sm group-hover:underline"
        >
          Read Full Story &rarr;
        </span>
      </div>
    </div>
  </div>
);


interface FeaturedPostsProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
}

export const FeaturedPosts: React.FC<FeaturedPostsProps> = ({ posts, onSelectPost }) => {
  if (!posts || posts.length === 0) {
    return null;
  }
  
  const featured = posts.slice(0, 3);
  
  const gridClasses: { [key: number]: string } = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };
  
  const gridClass = gridClasses[featured.length] || gridClasses[3];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-black tracking-tighter text-text-primary mb-6">
        Featured <span className="text-accent">Gists</span>
      </h2>
      <div className={`grid ${gridClass} gap-8`}>
        {featured.map(post => (
          <FeaturedBlogCard key={post.id} post={post} onReadMore={() => onSelectPost(post)} />
        ))}
      </div>
    </div>
  );
};