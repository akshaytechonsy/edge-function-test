'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';


// Types
interface Post {
  id: string;
  fileName: string;
  createdAt: string;
  caption: string;
  hashtags: string;
  source: string;
  imageUrl: string;
  newsTitle: string;
  fullContent: string;
}

interface FileObject {
  name: string;
  created_at: string;
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

export default function SocialMediaGenerator() {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  // Fetch existing posts from storage
  const fetchPosts = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data: files, error } = await supabase.storage
        .from('posts')
        .list('', {
          limit: 20,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error fetching posts:', error);
        setMessage('Error fetching posts');
        return;
      }

      if (!files) {
        setPosts([]);
        return;
      }

      // Get content for each text file
      const postsWithContent = await Promise.all(
        files
          .filter((file: FileObject) => file.name.endsWith('.txt'))
          .map(async (file: FileObject): Promise<Post | null> => {
            try {
              const { data, error } = await supabase.storage
                .from('posts')
                .download(file.name);

              if (error) throw error;

              const text = await data.text();
              const lines = text.split('\n');
              
              // Parse the content
              let caption = '';
              let hashtags = '';
              let source = '';
              let imageUrl = '';
              let newsTitle = '';
              
              lines.forEach((line: string) => {
                if (line.startsWith('Caption:')) {
                  caption = line.replace('Caption:', '').trim();
                } else if (line.startsWith('Hashtags:')) {
                  hashtags = line.replace('Hashtags:', '').trim();
                } else if (line.startsWith('Source:')) {
                  source = line.replace('Source:', '').trim();
                } else if (line.startsWith('Image URL:')) {
                  imageUrl = line.replace('Image URL:', '').trim();
                } else if (line.startsWith('Title:')) {
                  newsTitle = line.replace('Title:', '').trim();
                }
              });

              return {
                id: file.name,
                fileName: file.name,
                createdAt: file.created_at,
                caption,
                hashtags,
                source,
                imageUrl,
                newsTitle,
                fullContent: text
              };
            } catch (err) {
              console.error('Error reading file:', err);
              return null;
            }
          })
      );

      setPosts(postsWithContent.filter((post): post is Post => post !== null));
    } catch (error) {
      console.error('Error:', error);
      setMessage('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  // Generate new post
  const generatePost = async (): Promise<void> => {
    setIsGenerating(true);
    setMessage('');
    
      const response = await supabase.functions.invoke('actual-agent')
      
      if(response){
        fetchPosts();
        setIsGenerating(false);
        setMessage('✅ New post generated successfully!');
      }
    
  };

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 Social Media Post Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate AI-powered finance news posts with images and captions
          </p>
        </div>

        {/* Generate Button */}
        <div className="text-center mb-8">
          <button
            onClick={generatePost}
            disabled={isGenerating}
            className={`px-8 py-4 rounded-lg font-semibold text-white text-lg shadow-lg transform transition-all duration-200 ${
              isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Generating Post...
              </>
            ) : (
              <>
                <span className="mr-2">✨</span>
                Generate New Post
              </>
            )}
          </button>
          
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Refresh Posts Button */}
        <div className="text-center mb-8">
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔄 Refresh Posts'}
          </button>
        </div>

        {/* Posts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📱 Generated Posts ({posts.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">No posts generated yet</p>
              <p className="text-gray-400">Click Generate New Post to create your first post</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post: Post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Image */}
                  {post.imageUrl && post.imageUrl !== 'N/A' && (
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={post.imageUrl}
                        alt="Generated post"
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* News Title */}
                    {post.newsTitle && post.newsTitle !== 'N/A' && (
                      <h3 className="font-bold text-lg text-gray-800 mb-3 line-clamp-2">
                        {post.newsTitle}
                      </h3>
                    )}
                    
                    {/* Caption */}
                    {post.caption && post.caption !== 'N/A' && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">📝 Caption:</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {post.caption}
                        </p>
                      </div>
                    )}
                    
                    {/* Hashtags */}
                    {post.hashtags && post.hashtags !== 'N/A' && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">🏷️ Hashtags:</h4>
                        <p className="text-blue-600 text-sm">
                          {post.hashtags}
                        </p>
                      </div>
                    )}
                    
                    {/* Source */}
                    {post.source && post.source !== 'N/A' && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-2">🔗 Source:</h4>
                        <p className="text-gray-500 text-xs break-words">
                          {post.source}
                        </p>
                      </div>
                    )}
                    
                    {/* Created Date */}
                    <div className="text-xs text-gray-400 border-t pt-3">
                      📅 {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}