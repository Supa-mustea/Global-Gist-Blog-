import React, { useState, useEffect, useCallback } from 'react';
import { BlogPost as BlogPostType, Comment } from './types';
import {
  fetchPostsForTopic,
  searchAndGeneratePost,
  fetchPostById,
  createPost,
  updatePost,
  deletePost,
} from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TopicPills } from './components/TopicPills';
import { BlogCard } from './components/BlogCard';
import { BlogPostView } from './components/BlogPost';
import { LoadingSpinner } from './components/LoadingSpinner';
import { TOPICS } from './constants';
import { SearchBar } from './components/SearchBar';
import { AdminDashboard } from './components/AdminDashboard';
import { SavedPostsView } from './components/ReadLaterView';
import { FeaturedPosts } from './components/FeaturedPosts';

type View = 'main' | 'admin' | 'savedPosts';

const POSTS_PER_PAGE = 9;

const App: React.FC = () => {
  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPostType[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPostType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAppending, setIsAppending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>(TOPICS[0]);
  const [view, setView] = useState<View>('main');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

const handleFetchPosts = useCallback(async (topic: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedPost(null);
    
    // Reset pagination when topic changes
    if (topic !== currentTopic) {
        setPosts([]);
        setFeaturedPosts([]);
        setCurrentPage(1);
        setHasMorePosts(true);
    }

    setCurrentTopic(topic);
    setView('main');

    try {
        const fetchedPosts = await fetchPostsForTopic(topic, 1);
        setPosts(fetchedPosts);
        setFeaturedPosts(fetchedPosts.slice(0, 3));
        if (fetchedPosts.length < POSTS_PER_PAGE) {
            setHasMorePosts(false);
        }
    } catch (e: any) {
       setError(e.message || 'An unknown error occurred while fetching posts.');
    } finally {
       setIsLoading(false);
    }
}, [currentTopic]);

const handleLoadMore = async () => {
    if (isAppending || !hasMorePosts) return;

    setIsAppending(true);
    const nextPage = currentPage + 1;

    try {
        const newPosts = await fetchPostsForTopic(currentTopic, nextPage);
        if (newPosts.length > 0) {
            setPosts(prevPosts => [...prevPosts, ...newPosts]);
            setCurrentPage(nextPage);
        }
        if (newPosts.length < POSTS_PER_PAGE) {
            setHasMorePosts(false);
        }
    } catch (e: any) {
        setError("Failed to load more posts. Please try again later.");
    } finally {
        setIsAppending(false);
    }
};


const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedPost(null);
    setPosts([]);
    setFeaturedPosts([]);
    setCurrentTopic(`Search: "${query}"`);
    setView('main');
    setHasMorePosts(false); // Search results are not paginated

    try {
        const newPost = await searchAndGeneratePost(query);
        if (newPost) {
            setPosts([newPost]);
            setFeaturedPosts([newPost]);
        }
    } catch (e: any) {
       setError(e.message || `An error occurred while searching for "${query}".`);
    } finally {
       setIsLoading(false);
    }
};

const handleAddPost = async (postData: Omit<BlogPostType, 'id' | 'created_at' | 'sources' | 'author' | 'commentCount'>) => {
    try {
        const newPost = await createPost(postData);
        alert('Post created successfully!');
        // Refresh view to show the new post
        handleFetchPosts(currentTopic);
        return newPost;
    } catch(error) {
        console.error("Failed to save custom post:", error);
        alert("An error occurred while saving the post.");
        throw error;
    }
};

const handleUpdatePost = async (updatedPost: BlogPostType) => {
    try {
        await updatePost(updatedPost);
        alert('Post updated successfully!');
        
        handleFetchPosts(currentTopic); // Refresh the list
        
        if (selectedPost?.id === updatedPost.id) {
            // Update the detailed view if the user is currently on that page
            setSelectedPost(updatedPost);
        }
    } catch(error) {
        console.error("Failed to update post:", error);
        alert("An error occurred while updating the post.");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
        await deletePost(postId);
        alert('Post deleted successfully!');

        handleFetchPosts(currentTopic); // Force refresh of the main view
        if (selectedPost?.id === postId) {
            setSelectedPost(null); // Go back if viewing the deleted post
        }
    } catch(error) {
        console.error("Failed to delete post:", error);
        alert("An error occurred while deleting the post.");
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/post/')) {
        setIsLoading(true);
        const postId = hash.substring(7);
        try {
            const postFromDb = await fetchPostById(postId);
            if (postFromDb) {
              setSelectedPost(postFromDb);
            } else {
              // If post not found, go back to main page
               window.location.hash = '';
               handleFetchPosts(TOPICS[0]);
            }
        } catch (error) {
            console.error("Error fetching post by ID:", error);
            setError("Could not load the requested article.");
        } finally {
            setIsLoading(false);
        }
      } else {
        // Normal page load, fetch default topic
        handleFetchPosts(TOPICS[0]);
      }
    };
  
    initializeApp();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on initial mount

  const handleViewChange = (newView: View) => {
    if (view === 'main' && newView === 'main') {
        // If already on main view, 'Go Home' should refresh the default topic
        handleFetchPosts(TOPICS[0]);
    } else {
        window.location.hash = '';
        setSelectedPost(null);
        setView(newView);
    }
  };
  
  const handleSelectPost = (post: BlogPostType) => {
    setSelectedPost(post);
    window.location.hash = `#/post/${post.id}`;
  };

  const handleBackToPosts = () => {
    setSelectedPost(null);
    window.location.hash = '';
    // Optionally refresh the list in case comments were added
    handleFetchPosts(currentTopic);
  };

  const renderContent = () => {
    if (selectedPost) {
      return <BlogPostView 
                post={selectedPost} 
                onBack={handleBackToPosts} 
                onSelectPost={handleSelectPost}
              />;
    }

    switch(view) {
      case 'admin':
        return <AdminDashboard
                  onBackToBlog={() => handleViewChange('main')}
                  onAddPost={handleAddPost}
                  onUpdatePost={handleUpdatePost}
                  onDeletePost={handleDeletePost}
                />;
      case 'savedPosts':
        return <SavedPostsView onSelectPost={handleSelectPost} onBack={() => handleViewChange('main')} />;
      case 'main':
      default:
        if (isLoading && posts.length === 0) {
          return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
        }
    
        if (error) {
          return <div className="text-center text-red-400 p-8 bg-secondary rounded-lg">{error}</div>;
        }
    
        return (
          <>
            {featuredPosts.length > 0 && (
              <FeaturedPosts posts={featuredPosts} onSelectPost={handleSelectPost} />
            )}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <SearchBar onSearch={handleSearch} />
            </div>
            <TopicPills
              topics={TOPICS}
              activeTopic={currentTopic}
              onTopicSelect={(topic) => handleFetchPosts(topic)}
            />
            {posts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                      <BlogCard key={post.id} post={post} onReadMore={() => handleSelectPost(post)} />
                    ))}
                  </div>
                  {hasMorePosts && (
                      <div className="mt-12 text-center">
                          <button
                              onClick={handleLoadMore}
                              disabled={isAppending}
                              className="bg-accent hover:bg-blue-500 disabled:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
                          >
                              {isAppending ? <LoadingSpinner /> : 'Load More Posts'}
                          </button>
                      </div>
                  )}
                </>
            ) : (
              <div className="text-center py-16 bg-secondary rounded-lg">
                <h2 className="text-2xl font-bold text-text-primary">No Posts Found</h2>
                <p className="text-text-secondary mt-2">
                  We couldn't find any articles for "{currentTopic}". Try searching for something else or select a different topic.
                </p>
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header onGoHome={() => handleViewChange('main')} onGoToSavedPosts={() => handleViewChange('savedPosts')} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer onGoToAdmin={() => handleViewChange('admin')} />
    </div>
  );
};

export default App;