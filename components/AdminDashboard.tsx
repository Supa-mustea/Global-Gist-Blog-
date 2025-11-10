import React, { useState, useEffect, useMemo } from 'react';
import { BlogPost, Comment, Author } from '../types';
import { TOPICS } from '../constants';

interface AdminDashboardProps {
  onBackToBlog: () => void;
  onAddPost: (post: BlogPost) => void;
  onUpdatePost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
}

interface BlogCache {
  [topic: string]: {
    posts: BlogPost[];
    timestamp: number;
  };
}

type CommentStatus = 'pending' | 'approved' | 'rejected';
type AdminView = 'dashboard' | 'comments' | 'posts';

const defaultAuthor: Author = {
  name: "Global Gist Blog",
  bio: 'Global Gist blog, popularly known as "GGB", is an independent journalism expert in distilling the world\'s most fascinating stories, trends, and facts into clear, engaging blog posts.',
  avatarUrl: "https://picsum.photos/seed/global-gist-blog-avatar/100/100",
};

// --- Sub-Components ---

const StatCard: React.FC<{ title: string; value: string | number; description: string; children?: React.ReactNode }> = ({ title, value, description, children }) => (
  <div className="bg-primary p-6 rounded-xl shadow-lg flex flex-col">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">{title}</h3>
        <p className="text-3xl font-extrabold text-text-primary mt-2">{value}</p>
      </div>
      {children && <div className="text-accent">{children}</div>}
    </div>
    <p className="text-xs text-text-secondary mt-1">{description}</p>
  </div>
);

const AdminTabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary ${
      isActive
        ? 'bg-accent text-white'
        : 'text-text-secondary hover:bg-white/10'
    }`}
  >
    {label}
  </button>
);

const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}> = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', confirmVariant = 'primary' }) => {
  if (!isOpen) return null;

  const confirmClasses = {
    primary: 'bg-accent hover:bg-blue-500',
    danger: 'bg-red-600 hover:bg-red-500',
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md mx-auto p-6 border border-white/10">
        <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
        <div className="text-text-secondary mb-6">{message}</div>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="bg-primary hover:bg-white/10 text-text-primary font-bold py-2 px-4 rounded-lg transition-colors duration-300">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`${confirmClasses[confirmVariant]} text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


const TopicDistributionChart: React.FC<{ postsWithTopics: { post: BlogPost; topic: string }[] }> = ({ postsWithTopics }) => {
  const topicCounts = useMemo(() => {
    const counts = new Map<string, number>();
    postsWithTopics.forEach(({ post }) => {
      counts.set(post.topic, (counts.get(post.topic) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [postsWithTopics]);
  
  const maxCount = Math.max(...topicCounts.map(([, count]) => count), 0);
  if (topicCounts.length === 0) {
    return <div className="bg-primary p-6 rounded-xl text-center text-text-secondary italic">No posts found to generate chart.</div>;
  }
  return (
    <div className="bg-primary p-6 rounded-xl shadow-lg">
      <h3 className="text-lg font-bold text-text-primary mb-4">Post Distribution by Topic</h3>
      <div className="space-y-4">
        {topicCounts.map(([topic, count]) => (
          <div key={topic} className="flex items-center gap-4 text-sm">
            <span className="w-1/3 truncate text-text-secondary">{topic}</span>
            <div className="w-2/3 bg-secondary rounded-full h-6 flex items-center">
              <div
                className="bg-accent h-6 rounded-full flex items-center justify-end px-2"
                style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
              >
                <span className="font-bold text-white">{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- View Renderers ---

const DashboardView: React.FC<{
  stats: { totalPosts: number; totalComments: number; pendingComments: number; };
  allPostsWithTopics: { post: BlogPost; topic: string }[];
  recentComments: Comment[];
}> = ({ stats, allPostsWithTopics, recentComments }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard title="Total Posts" value={stats.totalPosts} description="Across all topics" />
      <StatCard title="Total Comments" value={stats.totalComments} description="Across all posts" />
      <StatCard title="Pending Comments" value={stats.pendingComments} description="Awaiting moderation" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TopicDistributionChart postsWithTopics={allPostsWithTopics} />
      <div className="bg-primary p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-bold text-text-primary mb-4">Recent Comments</h3>
        {recentComments.length > 0 ? (
          <ul className="space-y-4">
            {recentComments.slice(0, 5).map(c => (
              <li key={c.id} className="text-sm border-b border-white/10 pb-2">
                <p className="text-text-primary font-semibold">{c.author}</p>
                <p className="text-text-secondary truncate italic">"{c.text}"</p>
              </li>
            ))}
          </ul>
        ) : <p className="text-text-secondary italic">No recent comments.</p>}
      </div>
    </div>
  </div>
);

// (The existing renderCommentsView and renderPostsView components will be refactored and integrated below)

// --- Main Component ---

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToBlog, onAddPost, onUpdatePost, onDeletePost }) => {
  const [allPostsWithTopics, setAllPostsWithTopics] = useState<{ post: BlogPost; topic: string }[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  
  // State for posts management
  const [isPostEditorOpen, setIsPostEditorOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<BlogPost | null>(null);

  // State for confirmation modal
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: React.ReactNode; onConfirm: () => void; variant: 'primary' | 'danger' }>({
    isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'primary'
  });

  useEffect(() => {
    try {
      const cache: BlogCache = JSON.parse(localStorage.getItem('globalGistBlogCache') || '{}');
      const loadedPosts: {post: BlogPost, topic: string}[] = [];
      for (const topicKey in cache) {
          cache[topicKey].posts.forEach(p => {
              loadedPosts.push({ post: p, topic: p.topic });
          });
      }
      loadedPosts.sort((a, b) => parseInt(b.post.id.split('-').pop() || '0') - parseInt(a.post.id.split('-').pop() || '0'));
      setAllPostsWithTopics(loadedPosts);

      let storedComments: Comment[] = JSON.parse(localStorage.getItem('globalGistComments') || '[]');
      storedComments = storedComments.map(c => ({...c, status: c.status || 'approved' }));
      storedComments.sort((a, b) => b.timestamp - a.timestamp);
      setAllComments(storedComments);
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  const handleUpdateCommentStatus = (comment: Comment, newStatus: CommentStatus) => {
    setConfirmState({
      isOpen: true,
      title: `Confirm Action`,
      message: <>Are you sure you want to <strong>{newStatus}</strong> the comment by <strong>{comment.author}</strong>?</>,
      variant: newStatus === 'rejected' ? 'danger' : 'primary',
      onConfirm: () => {
        try {
          const updatedComments = allComments.map(c =>
            c.id === comment.id ? { ...c, status: newStatus } : c
          );
          localStorage.setItem('globalGistComments', JSON.stringify(updatedComments));
          setAllComments(updatedComments);
        } catch (error) {
          console.error("Failed to update comment status:", error);
          alert("Could not update the comment's status. Please try again.");
        }
        setConfirmState({ ...confirmState, isOpen: false });
      }
    });
  };

  const handleSavePost = (postToSave: BlogPost) => {
    if (postToEdit) {
      onUpdatePost(postToSave);
    } else {
      onAddPost(postToSave);
    }
    // Refresh posts list
    const cache: BlogCache = JSON.parse(localStorage.getItem('globalGistBlogCache') || '{}');
    const loadedPosts: {post: BlogPost, topic: string}[] = [];
     for (const topicKey in cache) {
          cache[topicKey].posts.forEach(p => loadedPosts.push({ post: p, topic: p.topic }));
      }
    loadedPosts.sort((a, b) => parseInt(b.post.id.split('-').pop() || '0') - parseInt(a.post.id.split('-').pop() || '0'));
    setAllPostsWithTopics(loadedPosts);
    setIsPostEditorOpen(false);
    setPostToEdit(null);
  };

  const handleDeleteClick = (post: BlogPost) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Post',
      message: <>Are you sure you want to permanently delete the post titled "<strong>{post.title}</strong>"? This action cannot be undone.</>,
      variant: 'danger',
      onConfirm: () => {
        onDeletePost(post.id);
        setAllPostsWithTopics(prev => prev.filter(p => p.post.id !== post.id));
        setConfirmState({ ...confirmState, isOpen: false });
      }
    });
  };
  
  const stats = useMemo(() => {
    return {
      totalPosts: allPostsWithTopics.length,
      totalComments: allComments.length,
      pendingComments: allComments.filter(c => c.status === 'pending').length,
    };
  }, [allPostsWithTopics, allComments]);

  // Combined Posts Management View
  const renderPostsView = () => (
    isPostEditorOpen ? (
        <PostEditor
            key={postToEdit?.id || 'new'}
            onSave={handleSavePost}
            onCancel={() => { setIsPostEditorOpen(false); setPostToEdit(null); }}
            post={postToEdit}
        />
    ) : (
      <div className="bg-secondary p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-text-primary">Manage Posts</h2>
            <button onClick={() => { setPostToEdit(null); setIsPostEditorOpen(true); }} className="bg-accent hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">
                Create New Post
            </button>
        </div>
        <PostsList postsWithTopics={allPostsWithTopics} onEdit={(post) => { setPostToEdit(post); setIsPostEditorOpen(true); }} onDelete={handleDeleteClick} />
      </div>
    )
  );
  
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
        confirmVariant={confirmState.variant}
      />
      <div>
        <button onClick={onBackToBlog} className="mb-6 bg-secondary hover:bg-white/10 text-text-primary font-bold py-2 px-4 rounded-lg transition-colors duration-300">
          &larr; Back to Blog
        </button>
        <h1 className="text-3xl font-black tracking-tighter">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">Manage your blog's content and comments.</p>
      </div>
      <div className="flex space-x-2 border-b border-white/10 pb-2">
        <AdminTabButton label="Dashboard" isActive={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
        <AdminTabButton label="Comments" isActive={activeView === 'comments'} onClick={() => setActiveView('comments')} />
        <AdminTabButton label="Manage Posts" isActive={activeView === 'posts'} onClick={() => setActiveView('posts')} />
      </div>

      <div className="mt-6">
        {activeView === 'dashboard' && <DashboardView stats={stats} allPostsWithTopics={allPostsWithTopics} recentComments={allComments} />}
        {activeView === 'comments' && <CommentsView allComments={allComments} posts={allPostsWithTopics.map(p => p.post)} handleUpdateCommentStatus={handleUpdateCommentStatus} />}
        {activeView === 'posts' && renderPostsView()}
      </div>
    </div>
  );
};

// --- Posts Management Components ---

const PostsList: React.FC<{
  postsWithTopics: { post: BlogPost; topic: string }[];
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
}> = ({ postsWithTopics, onEdit, onDelete }) => (
  <div className="overflow-x-auto">
    {postsWithTopics.length > 0 ? (
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-primary/50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Title</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Topic</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-secondary divide-y divide-white/10">
          {postsWithTopics.map(({ post }) => (
            <tr key={post.id}>
              <td className="px-6 py-4 max-w-sm text-sm text-text-primary font-medium"><p className="truncate">{post.title}</p></td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{post.topic}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button onClick={() => onEdit(post)} className="text-accent hover:text-blue-400 font-semibold">Edit</button>
                <button onClick={() => onDelete(post)} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : <p className="text-center text-text-secondary italic py-8">No posts created yet.</p>}
  </div>
);

const PostEditor: React.FC<{
  onSave: (post: BlogPost) => void;
  onCancel: () => void;
  post: BlogPost | null;
}> = ({ onSave, onCancel, post }) => {
    const [title, setTitle] = useState(post?.title || '');
    const [topic, setTopic] = useState(post?.topic || TOPICS[0]);
    const [summary, setSummary] = useState(post?.summary || '');
    const [content, setContent] = useState(post?.content || '');
    const [imageUrl, setImageUrl] = useState(post?.imageUrl || '');
    const [youtubeUrl, setYoutubeUrl] = useState(post?.youtubeVideoId || '');
    const [formError, setFormError] = useState<string | null>(null);

    const extractYouTubeId = (url: string): string | undefined => {
        if (!url) return undefined;
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        return match ? match[1] : undefined;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        if (!title.trim() || !summary.trim() || !content.trim()) {
            setFormError('Please fill out Title, Summary, and Content fields.');
            return;
        }
        const paragraphCount = content.split('\n').filter(p => p.trim() !== '').length;
        if (paragraphCount < 7) {
            setFormError('Content is too short. Please write at least 7 paragraphs.');
            return;
        }
        const videoId = extractYouTubeId(youtubeUrl);
        const savedPost: BlogPost = {
            id: post?.id || `custom-${new Date().getTime()}`,
            topic, title, summary, content, author: defaultAuthor, sources: post?.sources || [],
            imageUrl: imageUrl || `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`,
            youtubeVideoId: videoId,
            created_at: post?.created_at || new Date().toISOString(),
        };
        onSave(savedPost);
    };

    return (
        <div className="bg-secondary p-6 sm:p-8 rounded-xl shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">{post ? 'Edit Post' : 'Create New Post'}</h2>
              <button onClick={onCancel} className="text-text-secondary hover:text-accent">Cancel</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="post-title" className="block text-sm font-medium text-text-secondary mb-2">Title</label>
                        <input id="post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                     <div>
                        <label htmlFor="post-topic" className="block text-sm font-medium text-text-secondary mb-2">Topic</label>
                        <select id="post-topic" value={topic} onChange={(e) => setTopic(e.target.value)} required className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent appearance-none">
                            {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="post-summary" className="block text-sm font-medium text-text-secondary mb-2">Summary</label>
                    <textarea id="post-summary" value={summary} onChange={(e) => setSummary(e.target.value)} required rows={3} className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="post-content" className="block text-sm font-medium text-text-secondary mb-2">Content (Markdown)</label>
                    <textarea id="post-content" value={content} onChange={(e) => setContent(e.target.value)} required rows={12} className="w-full bg-primary p-3 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="post-image" className="block text-sm font-medium text-text-secondary mb-2">Image URL (Optional)</label>
                    <input id="post-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <div>
                    <label htmlFor="post-youtube" className="block text-sm font-medium text-text-secondary mb-2">YouTube URL or ID (Optional)</label>
                    <input id="post-youtube" type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent" />
                </div>
                {formError && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm"><p>{formError}</p></div>}
                <div>
                    <button type="submit" className="w-full bg-accent hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-300">
                        {post ? 'Update Post' : 'Publish Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};


// --- Comments Management Component ---
const CommentsView: React.FC<{
  allComments: Comment[];
  posts: BlogPost[];
  handleUpdateCommentStatus: (comment: Comment, status: CommentStatus) => void;
}> = ({ allComments, posts, handleUpdateCommentStatus }) => {
    const [activeTab, setActiveTab] = useState<CommentStatus>('pending');
    const [autoApprove, setAutoApprove] = useState<boolean>(() => JSON.parse(localStorage.getItem('globalGistAutoApprove') || 'false'));

    const handleToggleAutoApprove = () => {
        const newSetting = !autoApprove;
        setAutoApprove(newSetting);
        localStorage.setItem('globalGistAutoApprove', JSON.stringify(newSetting));
    };
    
    const postMap = useMemo(() => {
        const map = new Map<string, string>();
        posts.forEach(p => map.set(p.id, p.title));
        return map;
    }, [posts]);

    const filteredComments = useMemo(() => {
        return allComments.filter(c => c.status === activeTab);
    }, [activeTab, allComments]);
    
    const commentCounts = useMemo(() => ({
        pending: allComments.filter(c => c.status === 'pending').length,
        approved: allComments.filter(c => c.status === 'approved').length,
        rejected: allComments.filter(c => c.status === 'rejected').length,
    }), [allComments]);

    const CommentTabButton: React.FC<{ label: string; count: number; status: CommentStatus }> = ({ label, count, status }) => (
      <button onClick={() => setActiveTab(status)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === status ? 'bg-primary text-accent border-b-2 border-accent' : 'text-text-secondary hover:bg-primary/50'}`}>
          {label} <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === status ? 'bg-accent text-white' : 'bg-white/10'}`}>{count}</span>
      </button>
    );

    return (
        <div className="bg-secondary p-6 sm:p-8 rounded-xl shadow-2xl">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text-primary">Comment Moderation</h2>
                <label htmlFor="auto-approve-toggle" className="flex items-center cursor-pointer">
                    <span className="mr-3 text-sm font-medium text-text-secondary">Auto-Approve</span>
                    <div className="relative">
                        <input id="auto-approve-toggle" type="checkbox" className="sr-only" checked={autoApprove} onChange={handleToggleAutoApprove} />
                        <div className={`block w-14 h-8 rounded-full transition-colors ${autoApprove ? 'bg-accent' : 'bg-primary'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autoApprove ? 'translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>
            <div className="border-b border-white/10 mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <CommentTabButton label="Pending" count={commentCounts.pending} status="pending" />
                    <CommentTabButton label="Approved" count={commentCounts.approved} status="approved" />
                    <CommentTabButton label="Rejected" count={commentCounts.rejected} status="rejected" />
                </nav>
            </div>
            <div className="overflow-x-auto">
                {filteredComments.length > 0 ? (
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-primary/50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Author & Comment</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">In Response To</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                          </tr>
                        </thead>
                        <tbody className="bg-secondary divide-y divide-white/10">
                            {filteredComments.map(comment => (
                                <tr key={comment.id}>
                                    <td className="px-6 py-4 max-w-sm">
                                      <p className="text-sm font-medium text-text-primary">{comment.author}</p>
                                      <p className="text-sm text-text-secondary line-clamp-2 mt-1">{comment.text}</p>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs text-sm text-text-secondary"><p className="truncate">{postMap.get(comment.postId) || 'Archived Post'}</p></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        {comment.status !== 'approved' && <button onClick={() => handleUpdateCommentStatus(comment, 'approved')} className="text-green-500 hover:text-green-400 font-semibold">Approve</button>}
                                        {comment.status !== 'rejected' && <button onClick={() => handleUpdateCommentStatus(comment, 'rejected')} className="text-red-500 hover:text-red-400 font-semibold">Reject</button>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-center text-text-secondary italic py-8">No comments in this category.</p>}
            </div>
        </div>
    );
};