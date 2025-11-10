import React, { useState, useEffect } from 'react';
import { BlogPost, Comment, Author } from '../types';
import { fetchRelatedPosts, extractKeywordsFromContent, findYouTubeVideoId, fetchCommentsForPost, addComment } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

interface BlogPostProps {
  post: BlogPost;
  onBack: () => void;
  onSelectPost: (post: BlogPost) => void;
}

const getSavedPosts = (): BlogPost[] => {
  try {
    return JSON.parse(localStorage.getItem('globalGistSavedPosts') || '[]');
  } catch (error) {
    console.error("Failed to parse saved posts from localStorage:", error);
    return [];
  }
};

// --- Helper Functions for Meta Tags ---

const setMetaTag = (selector: string, content: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute('content', content);
  }
};

const defaultMetas = {
    title: 'Global Gist Blog | AI-Powered Insights on News, Lifestyle & More',
    description: 'An AI-powered blog that discusses the top gists from around the globe, including news, lifestyle, tourism, and amazing historical stories, all grounded with real-time web search.',
    keywords: 'AI blog, global news, lifestyle trends, tourism, history, technology, web search, AI journalism, fintech, innovation',
    ogTitle: 'Global Gist Blog | AI-Powered Insights',
    ogDescription: 'An AI-powered blog discussing news, lifestyle, tourism, and history with real-time web search.',
    ogImage: 'https://storage.googleapis.com/aai-web-samples/user-assets/og_global_gist.png',
    ogUrl: window.location.origin,
    twitterTitle: 'Global Gist Blog | AI-Powered Insights',
    twitterDescription: 'An AI-powered blog discussing news, lifestyle, tourism, and history with real-time web search.',
    twitterImage: 'https://storage.googleapis.com/aai-web-samples/user-assets/og_global_gist.png',
};

// Function to set meta tags for the current post
const updateMetaForPost = (post: BlogPost, keywords: string[]) => {
    document.title = `${post.title} | Global Gist Blog`;
    setMetaTag('meta[name="description"]', post.summary);
    // Combine post topic with extracted keywords for better SEO
    const finalKeywords = [post.topic, ...keywords].filter((v, i, a) => a.indexOf(v) === i).join(', ');
    setMetaTag('meta[name="keywords"]', finalKeywords);
    
    // Open Graph
    setMetaTag('meta[property="og:title"]', post.title);
    setMetaTag('meta[property="og:description"]', post.summary);
    setMetaTag('meta[property="og:image"]', post.imageUrl);
    setMetaTag('meta[property="og:url"]', window.location.href);
    
    // Twitter Card
    setMetaTag('meta[name="twitter:title"]', post.title);
    setMetaTag('meta[name="twitter:description"]', post.summary);
    setMetaTag('meta[name="twitter:image"]', post.imageUrl);
};

// Function to reset meta tags to default
const resetMetaTags = () => {
    document.title = defaultMetas.title;
    setMetaTag('meta[name="description"]', defaultMetas.description);
    setMetaTag('meta[name="keywords"]', defaultMetas.keywords);
    
    // Open Graph
    setMetaTag('meta[property="og:title"]', defaultMetas.ogTitle);
    setMetaTag('meta[property="og:description"]', defaultMetas.ogDescription);
    setMetaTag('meta[property="og:image"]', defaultMetas.ogImage);
    setMetaTag('meta[property="og:url"]', defaultMetas.ogUrl);

    // Twitter Card
    setMetaTag('meta[name="twitter:title"]', defaultMetas.twitterTitle);
    setMetaTag('meta[name="twitter:description"]', defaultMetas.twitterDescription);
    setMetaTag('meta[name="twitter:image"]', defaultMetas.twitterImage);
};


// A helper to parse inline markdown elements like bold, italic, code, links, and images.
const parseInline = (text: string) => {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async" class="rounded-lg my-6 shadow-lg w-full object-cover" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)((?:[^*]|\*[^*])+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');

  return { __html: html };
};


// A component to render markdown content by parsing it into semantic HTML blocks.
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderedBlocks = React.useMemo(() => {
    const blocks: React.ReactNode[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      if (line.startsWith('### ')) {
        blocks.push(<h3 key={i} dangerouslySetInnerHTML={parseInline(line.substring(4))} />);
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(<h2 key={i} dangerouslySetInnerHTML={parseInline(line.substring(3))} />);
        continue;
      }
      if (line.startsWith('# ')) {
        blocks.push(<h1 key={i} dangerouslySetInnerHTML={parseInline(line.substring(2))} />);
        continue;
      }
      if (line.startsWith('```')) {
        const codeLines = [];
        i++;
        while(i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        blocks.push(
          <pre key={i}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
        continue;
      }
      if (line.startsWith('> ')) {
        const quoteLines = [line.substring(2)];
        i++;
        while(i < lines.length && lines[i]?.startsWith('> ')) {
          quoteLines.push(lines[i].substring(2));
          i++;
        }
        i--;
        blocks.push(<blockquote key={i} dangerouslySetInnerHTML={parseInline(quoteLines.join(' '))} />);
        continue;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
          const listItems = [];
          while(i < lines.length && (lines[i]?.startsWith('* ') || lines[i]?.startsWith('- '))) {
              listItems.push(
                  <li key={i} dangerouslySetInnerHTML={parseInline(lines[i].substring(2))} />
              );
              i++;
          }
          i--;
          blocks.push(<ul key={`ul-${i}`}>{listItems}</ul>);
          continue;
      }
      const paraLines = [line];
      i++;
      while(
          i < lines.length && 
          lines[i]?.trim() !== '' &&
          !lines[i].startsWith('#') &&
          !lines[i].startsWith('```') &&
          !lines[i].startsWith('>') &&
          !lines[i].startsWith('* ') &&
          !lines[i].startsWith('- ')
      ) {
          paraLines.push(lines[i]);
          i++;
      }
      i--;
      blocks.push(<p key={i} dangerouslySetInnerHTML={parseInline(paraLines.join(' '))} />);
    }
    return blocks;
  }, [content]);

  return (
    <div className="prose prose-invert prose-lg max-w-none 
                    prose-p:text-text-secondary prose-p:leading-relaxed prose-p:tracking-wide
                    prose-headings:text-text-primary 
                    prose-a:text-accent hover:prose-a:text-blue-400 
                    prose-strong:text-text-primary prose-blockquote:border-accent 
                    prose-blockquote:text-text-secondary prose-blockquote:not-italic
                    prose-code:text-accent prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                    prose-pre:bg-primary prose-pre:p-4 prose-pre:rounded-lg">
      {renderedBlocks}
    </div>
  );
};

// --- YouTube Embed Component ---
const YouTubeEmbed: React.FC<{ videoId: string | null; isLoading: boolean; postTitle: string; }> = ({ videoId, isLoading, postTitle }) => {
  if (isLoading) {
    return (
      <div className="my-8 animate-pulse">
        <div className="aspect-video w-full bg-primary rounded-lg"></div>
      </div>
    );
  }

  if (!videoId) {
    return null; // Don't render anything if no video ID is found
  }

  return (
    <div className="my-8">
      <div className="aspect-video w-full">
        <iframe
          className="w-full h-full rounded-lg shadow-lg"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={`YouTube video player for: ${postTitle}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};


// --- Comment Section Components ---

interface CommentFormProps {
  onAddComment: (author: string, text: string) => Promise<'approved' | 'pending'>;
}

const CommentForm: React.FC<CommentFormProps> = ({ onAddComment }) => {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<'not-submitted' | 'pending' | 'approved'>('not-submitted');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (author.trim() && text.trim()) {
      const status = await onAddComment(author, text);
      setText(''); // Clear text, keep author for subsequent comments
      setSubmissionStatus(status);
    }
  };

  if (submissionStatus !== 'not-submitted') {
    return (
      <div className="mt-8 bg-primary p-6 rounded-lg text-center">
        <h4 className="font-bold text-text-primary text-lg">Thank you for your comment!</h4>
        {submissionStatus === 'pending' ? (
           <p className="text-text-secondary mt-2">It has been submitted for moderation and will appear once approved.</p>
        ) : (
           <p className="text-text-secondary mt-2">It has been posted successfully!</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 bg-primary p-6 rounded-lg">
      <h4 className="font-bold text-text-primary mb-4">Leave a Comment</h4>
      <div className="space-y-4">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Your Name"
          required
          className="w-full bg-secondary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your Comment..."
          required
          rows={4}
          className="w-full bg-secondary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
        />
      </div>
      <button
        type="submit"
        className="mt-4 w-full bg-accent hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-300"
      >
        Post Comment
      </button>
    </form>
  );
};

const CommentItem: React.FC<{ comment: Comment; isNew: boolean }> = ({ comment, isNew }) => {
  const [isVisible, setIsVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => setIsVisible(true), 100); // Short delay allows initial styles to apply before transition
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div
      className={`bg-primary p-4 rounded-lg shadow transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-text-primary text-lg">{comment.author}</p>
        <p className="text-xs text-text-secondary">
          {new Date(comment.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>
      <p className="text-text-secondary whitespace-pre-wrap">{comment.text}</p>
    </div>
  );
};

interface CommentListProps {
  comments: Comment[];
  latestCommentId: string | null;
}

const CommentList: React.FC<CommentListProps> = ({ comments, latestCommentId }) => {
  if (comments.length === 0) {
    return <p className="text-text-secondary italic text-center py-4">No comments yet. Be the first to share your thoughts!</p>;
  }

  return (
    <div className="space-y-6">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} isNew={comment.id === latestCommentId} />
      ))}
    </div>
  );
};


// --- Related Posts Components ---

const RelatedPostCard: React.FC<{ post: BlogPost, onSelect: (post: BlogPost) => void }> = ({ post, onSelect }) => (
  <div 
    onClick={() => onSelect(post)}
    className="bg-primary rounded-lg overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300"
    role="button"
    tabIndex={0}
    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(post)}
  >
    <img 
      className="w-full h-32 object-cover" 
      src={post.imageUrl} 
      alt={post.title} 
      loading="lazy"
      decoding="async"
    />
    <div className="p-4">
      <h5 className="text-md font-bold text-text-primary group-hover:text-accent transition-colors duration-300 line-clamp-2">{post.title}</h5>
    </div>
  </div>
);

const RelatedPostsSection: React.FC<{
  posts: BlogPost[];
  isLoading: boolean;
  error: string | null;
  onSelectPost: (post: BlogPost) => void;
}> = ({ posts, isLoading, error, onSelectPost }) => {
  return (
    <div className="mt-12 bg-secondary p-6 sm:p-10 rounded-xl shadow-2xl">
      <h3 className="text-2xl font-bold text-text-primary mb-6">You Might Also Like...</h3>
      {isLoading && <div className="flex justify-center"><LoadingSpinner /></div>}
      {error && <p className="text-red-400 text-center">{error}</p>}
      {!isLoading && !error && (
        posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {posts.map(p => (
              <RelatedPostCard key={p.id} post={p} onSelect={onSelectPost} />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary italic text-center">No related posts found.</p>
        )
      )}
    </div>
  );
};

// --- Social Share Components ---

const SocialShareButton: React.FC<{ href: string; ariaLabel: string; children: React.ReactNode }> = ({ href, ariaLabel, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className="text-text-secondary hover:text-accent transition-colors duration-300"
  >
    {children}
  </a>
);

const ShareButtons: React.FC<{ post: BlogPost }> = ({ post }) => {
  const [isCopied, setIsCopied] = useState(false);
  const postUrl = window.location.href; 
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(post.title);
  const encodedSummary = encodeURIComponent(post.summary);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      alert('Failed to copy link.');
    });
  };

  const twitterIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
  );
  const facebookIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7.02H7.9V12h2.55V9.83c0-2.52 1.5-3.9 3.8-3.9 1.1 0 2.22.2 2.22.2v2.5h-1.3c-1.22 0-1.6.73-1.6 1.52V12h2.8l-.45 2.98h-2.35v7.02c4.78-.75 8.44-4.9 8.44-9.9C22 6.53 17.5 2.04 12 2.04z"></path></svg>
  );
  const linkedInIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"></path></svg>
  );
  const linkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"></path></svg>
  );

  return (
    <div className="flex items-center gap-6 my-6 border-y border-white/10 py-3">
      <span className="text-sm font-bold text-text-secondary">Share:</span>
      <div className="flex items-center gap-4">
        <SocialShareButton
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
          ariaLabel="Share on Twitter"
        >
          {twitterIcon}
        </SocialShareButton>
        <SocialShareButton
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          ariaLabel="Share on Facebook"
        >
          {facebookIcon}
        </SocialShareButton>
        <SocialShareButton
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedSummary}`}
          ariaLabel="Share on LinkedIn"
        >
          {linkedInIcon}
        </SocialShareButton>
        <button
          onClick={handleCopyLink}
          aria-label="Copy link to clipboard"
          className="text-text-secondary hover:text-accent transition-colors duration-300"
        >
          {isCopied ? (
            <span className="text-sm font-semibold text-green-400">✓ Copied</span>
          ) : (
            linkIcon
          )}
        </button>
      </div>
    </div>
  );
};

// --- Author Profile Component ---
const AuthorProfile: React.FC<{ author: Author }> = ({ author }) => (
  <div className="mt-12 bg-primary p-6 rounded-xl shadow-lg flex items-start sm:items-center gap-6">
    <img
      src={author.avatarUrl}
      alt={`Avatar for ${author.name}`}
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-accent"
    />
    <div className="flex-1">
      <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Written By</p>
      <h4 className="text-xl sm:text-2xl font-bold text-text-primary mt-1">{author.name}</h4>
      <p className="text-text-secondary mt-2 text-sm sm:text-base">{author.bio}</p>
    </div>
  </div>
);


// --- Main BlogPostView Component ---

export const BlogPostView: React.FC<BlogPostProps> = ({ post, onBack, onSelectPost }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState<boolean>(true);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [latestCommentId, setLatestCommentId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(post.youtubeVideoId || null);
  const [isVideoIdLoading, setIsVideoIdLoading] = useState<boolean>(!post.youtubeVideoId);


  useEffect(() => {
    fetchCommentsForPost(post.id)
        .then(setComments)
        .catch(err => console.error("Failed to load comments:", err));

    const savedPosts = getSavedPosts();
    setIsSaved(savedPosts.some(p => p.id === post.id));

  }, [post.id]);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchRelatedContentAndSetMeta = async () => {
      setIsLoadingRelated(true);
      setRelatedError(null);
      setRelatedPosts([]);
      try {
        const keywords = await extractKeywordsFromContent(post.content);
        updateMetaForPost(post, keywords); // Set meta tags with keywords
        const searchKeywords = keywords.length > 0 ? keywords : [post.title];
        const fetchedPosts = await fetchRelatedPosts(searchKeywords, post.id);
        setRelatedPosts(fetchedPosts);
      } catch (e: any) {
        updateMetaForPost(post, [post.topic]); // Fallback if keyword extraction fails
        setRelatedError("Could not load related articles.");
      } finally {
        setIsLoadingRelated(false);
      }
    };

    const fetchVideoId = async () => {
      if (post.youtubeVideoId) {
          setYoutubeVideoId(post.youtubeVideoId);
          setIsVideoIdLoading(false);
          return;
      }
      setIsVideoIdLoading(true);
      try {
          const videoId = await findYouTubeVideoId(post.title);
          setYoutubeVideoId(videoId);
      } catch (error) {
          console.error("Failed to fetch YouTube video ID:", error);
          setYoutubeVideoId(null);
      } finally {
          setIsVideoIdLoading(false);
      }
    };

    fetchRelatedContentAndSetMeta();
    fetchVideoId();
    
    // Cleanup function: Reset meta tags when the user navigates away from this post.
    return () => {
        resetMetaTags();
    };
  }, [post.id, post.title, post.summary, post.content, post.imageUrl, post.topic, post.youtubeVideoId]);


  const handleAddComment = async (author: string, text: string): Promise<'approved' | 'pending'> => {
    const autoApproveEnabled = JSON.parse(localStorage.getItem('globalGistAutoApprove') || 'false');
    const status = autoApproveEnabled ? 'approved' : 'pending';

    const newCommentData: Omit<Comment, 'id' | 'created_at' | 'timestamp'> = {
        postId: post.id,
        author,
        text,
        status,
    };
    
    const savedComment = await addComment(newCommentData);
    
    if (savedComment.status === 'approved') {
        setComments(prevComments => [...prevComments, savedComment]);
        setLatestCommentId(savedComment.id);
    }
    
    // FIX: Return the locally-determined status to match the function's return type.
    // The `addComment` service returns a broadly-typed `Comment` object, but the
    // actual status will match what was sent.
    return status;
  };

  const handleToggleSaveForLater = () => {
    const savedPosts = getSavedPosts();
    let updatedPosts: BlogPost[];
    if (isSaved) {
      updatedPosts = savedPosts.filter(p => p.id !== post.id);
    } else {
      updatedPosts = [...savedPosts, post];
    }
    localStorage.setItem('globalGistSavedPosts', JSON.stringify(updatedPosts));
    setIsSaved(!isSaved);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-wrap gap-4 justify-between items-center">
        <button
          onClick={onBack}
          className="bg-secondary hover:bg-white/10 text-text-primary font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          &larr; Back to Posts
        </button>
        <button
          onClick={handleToggleSaveForLater}
          className={`font-bold py-2 px-4 rounded-lg transition-colors duration-300 ${
            isSaved 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-accent hover:bg-blue-500 text-white'
          }`}
        >
          {isSaved ? '✓ Saved' : 'Save for Later'}
        </button>
      </div>
      
      <article className="bg-secondary p-6 sm:p-10 rounded-xl shadow-2xl">
        <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tighter">{post.title}</h1>
        
        <ShareButtons post={post} />

        <figure className="mb-8">
            <img className="w-full h-auto max-h-[500px] object-cover rounded-lg" src={post.imageUrl} alt={post.title} />
            {post.imageDescription && (
                <figcaption className="mt-2 text-center text-sm text-text-secondary italic">
                    {post.imageDescription}
                </figcaption>
            )}
        </figure>
        
        <YouTubeEmbed videoId={youtubeVideoId} isLoading={isVideoIdLoading} postTitle={post.title} />

        <MarkdownRenderer content={post.content} />

        {post.sources && post.sources.length > 0 && (
          <div className="mt-12 border-t border-white/10 pt-6">
            <h4 className="text-lg font-bold text-text-secondary mb-3">Sources</h4>
            <ul className="space-y-4">
              {(() => {
                const validSources = post.sources.filter(source => source.web?.uri);
                const sourcesToShow = validSources.slice(0, 10);
                
                return sourcesToShow.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.web!.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent rounded p-1 -m-1"
                    >
                      <p className="font-semibold text-accent group-hover:underline break-words">
                        {source.web!.title || 'Untitled Source'}
                      </p>
                    </a>
                  </li>
                ));
              })()}
            </ul>
          </div>
        )}
      </article>

      <AuthorProfile author={post.author} />

      <RelatedPostsSection
        posts={relatedPosts}
        isLoading={isLoadingRelated}
        error={relatedError}
        onSelectPost={onSelectPost}
      />

      <div className="mt-12 bg-secondary p-6 sm:p-10 rounded-xl shadow-2xl">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Comments ({comments.length})</h3>
        <CommentList comments={comments} latestCommentId={latestCommentId} />
        <CommentForm onAddComment={handleAddComment} />
      </div>

    </div>
  );
};