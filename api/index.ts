// --- SERVER-SIDE API ---
// This file is a secure, serverless function that acts as the backend for the blog.
// It handles all interactions with the database (Supabase) and the AI model (Gemini).

import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { BlogPost, Author, GroundingSource, Comment } from '../types';
import { TOPICS } from "../constants";

// --- SECURITY ---
// Credentials are accessed from environment variables on the server.
// Recommended: set a SUPABASE_SERVICE_ROLE_KEY for server-side writes and keep
// the SUPABASE_ANON_KEY for client-side/public reads. The service role key must
// only be stored on the server or in your hosting provider's secret store.
const API_KEY = process.env.API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Minimal required values for the server to operate.
if (!API_KEY || !SUPABASE_URL) {
    throw new Error("Missing required environment variables on the server. Ensure API_KEY and SUPABASE_URL are set.");
}

if (!SUPABASE_ANON_KEY && !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase credentials missing: set at least SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY.");
}

// --- CLIENT INITIALIZATION ---
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Create Supabase clients. If a service role key is provided, use that for the
// main server client (it has elevated privileges and can bypass RLS). Otherwise
// fall back to the anon key — note that writes may fail if Row Level Security
// (RLS) prevents anonymous inserts/updates/deletes.
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;
const supabase = SUPABASE_SERVICE_ROLE_KEY ? supabaseAdmin! : createClient(SUPABASE_URL, SUPABASE_ANON_KEY!);


// --- UTILITIES & DEFAULT DATA ---
const defaultAuthor: Author = {
  name: "Global Gist Blog",
  bio: 'global Gist blog popular known as "GGB" is an independent journalism experts in distilling the world\'s most fascinating stories, trends, and facts into clear, engaging blog posts. For viewers to see and engage with',
  avatarUrl: "https://picsum.photos/seed/global-gist-blog-avatar/100/100",
};

const plutowealthArticleData = {
    id: 'plutowealth-default-article-2025',
    topic: 'Breakthrough Tech Innovations',
    title: 'Plutowealth: How Three Young Innovators Are Building Africa’s Next Generation Fintech Platform',
    summary: 'In 2025, three Nigerian tech entrepreneurs came together with a shared vision: to make digital wealth management and financial literacy accessible to everyone. That vision gave birth to Plutowealth, a rising fintech company.',
    imageUrl: 'https://storage.googleapis.com/aai-web-samples/user-assets/tech-bootcamp-attendee.png',
    imageDescription: "Software innovation exhibition, Techminds Academy, May 2025.",
    sources: [
        { web: { title: 'Techminds Academy', uri: 'https://techmindsacademy.org' } },
        { web: { title: 'Supabros Inc.', uri: 'https://supabrosinc.vercel.app' } },
        { web: { title: 'Plutowealth GitHub Organization', uri: 'https://github.com/Plutowealth-org' } },
    ],
    content: `
### **Introduction**
In 2025, three Nigerian tech entrepreneurs — **Joseph Soronadi**, **Mustapha Lawal**, and **Abdulrahman Lawal** — came together with a shared vision: to make digital wealth management and financial literacy accessible to everyone. That vision gave birth to **Plutowealth**, a rising fintech company that’s already gaining attention in Abuja’s growing tech ecosystem.
### **The Beginning**
Plutowealth was founded on the belief that technology can bridge the gap between financial education and financial empowerment. The company’s founders — all tech enthusiasts — began developing digital tools to help users understand savings, investments, and personal finance in simple, engaging ways. According to **Joseph Soronadi**, a software engineer and founder of [Techminds Academy](https://techmindsacademy.org), “Our mission is to simplify financial literacy through innovation. We want to make wealth management something everyone can learn, not just professionals.”
### **The Team Behind Plutowealth**
The founding team represents a blend of software engineering, design, and entrepreneurial talent:
*   **Joseph Soronadi**, an educator and technologist, brings his experience from running Techminds Academy — a training hub for aspiring developers in Abuja.
*   **Mustapha Lawal** and **Abdulrahman Lawal**, popularly known as the **Lawal Brothers**, are co-founders of [Supabros](https://supabrosinc.vercel.app), a creative technology company that blends design and innovation for brands across Africa.
Together, the trio has created an ecosystem that connects technology education (Techminds), digital creativity (Supabros), and financial innovation (Plutowealth).
### **Collaboration and Growth**
Plutowealth’s approach combines community learning and open-source development. Its projects are available publicly through the [Plutowealth GitHub organization](https://github.com/Plutowealth-org), where developers can explore or contribute to fintech tools in progress. The company also collaborates with Techminds Academy to host bootcamps focused on **financial technology education**, preparing the next wave of developers and innovators in Nigeria.
### **Looking Ahead**
While still in its early stages, Plutowealth is already building traction through partnerships and developer-driven innovation. The team plans to expand its educational outreach and integrate smart financial systems that will make budgeting, investing, and wealth tracking more accessible to young Africans. As the African fintech landscape continues to evolve, Plutowealth’s story reflects the growing synergy between technology, creativity, and finance.
    `,
    author: {
        name: "Young Africans Scholars",
        bio: "A collective of writers and researchers dedicated to highlighting innovation and entrepreneurship across the African continent.",
        avatarUrl: "https://picsum.photos/seed/young-african-scholars/100/100",
    }
};

const cleanJsonString = (text: string): string => {
  let cleanedText = text.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3, cleanedText.length - 3).trim();
  }
  return cleanedText;
};

// --- DATABASE HELPERS ---
const mapDbPostToBlogPost = (dbPost: any): BlogPost => {
    return {
        id: dbPost.id,
        topic: dbPost.topic,
        title: dbPost.title,
        summary: dbPost.summary,
        content: dbPost.content,
        imageUrl: dbPost.image_url,
        imageDescription: dbPost.image_description,
        youtubeVideoId: dbPost.youtube_video_id,
        sources: dbPost.sources || [],
        author: {
            name: dbPost.author_name,
            bio: dbPost.author_bio,
            avatarUrl: dbPost.author_avatar_url,
        },
        created_at: dbPost.created_at,
    };
};

const mapBlogPostToDbPost = (post: BlogPost) => {
    return {
        id: post.id,
        topic: post.topic,
        title: post.title,
        summary: post.summary,
        content: post.content,
        image_url: post.imageUrl,
        image_description: post.imageDescription,
        youtube_video_id: post.youtubeVideoId,
        sources: post.sources,
        author_name: post.author.name,
        author_bio: post.author.bio,
        author_avatar_url: post.author.avatarUrl,
    };
};

// --- GEMINI API SCHEMAS ---
const blogPostSchema = {
  type: Type.OBJECT, properties: { posts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, summary: { type: Type.STRING }, content: { type: Type.STRING } }, required: ["title", "summary", "content"] } } }, required: ["posts"] };
const youtubeVideoIdSchema = { type: Type.OBJECT, properties: { videoId: { type: Type.STRING } }, required: ["videoId"] };
const keywordSchema = { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["tags"] };


// --- CORE API ACTIONS ---

async function generateAndSavePosts(topic: string, count: number = 10, excludeTitle: string | null = null): Promise<BlogPost[]> {
    let prompt = `Generate ${count} high-quality, comprehensive blog posts about "${topic}". The articles should be written in a journalistic, factual style. Each post must be at least 7-9 detailed paragraphs. Use Google Search for accuracy. Integrate citations like [Source Title].`;
    if (excludeTitle) {
        prompt += ` Do NOT generate a post with the title "${excludeTitle}".`;
    }
    prompt += ` Output a JSON object adhering to this schema: ${JSON.stringify(blogPostSchema)}. Ensure all string values are properly escaped.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const jsonText = cleanJsonString(response.text);
    const parsed = JSON.parse(jsonText);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const newBlogPosts: BlogPost[] = parsed.posts.map((post: any, index: number) => ({
      id: `${topic.replace(/\s+/g, '-')}-${index}-${new Date().getTime()}`,
      topic: topic,
      title: post.title,
      summary: post.summary,
      content: post.content,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(post.title)}/600/400`,
      sources: sources as GroundingSource[],
      author: defaultAuthor,
      created_at: new Date().toISOString(),
    }));

    const dbPosts = newBlogPosts.map(mapBlogPostToDbPost);
    const { error } = await supabase.from('posts').insert(dbPosts);
    if (error) throw new Error(`Supabase insert error: ${error.message}`);
    
    return newBlogPosts;
}


// --- MAIN REQUEST HANDLER ---
export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();

    if (!action) {
      return new Response(JSON.stringify({ error: "Missing action" }), { status: 400 });
    }

    switch (action) {
      // --- POSTS ---
      case 'getPosts': {
        const { topic, page = 1, limit = 9 } = payload;
        const offset = (page - 1) * limit;
        
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('topic', topic)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        const posts = data.map(mapDbPostToBlogPost);
        return new Response(JSON.stringify(posts), { status: 200 });
      }
      case 'getPostById': {
          const { postId } = payload;
          const { data, error } = await supabase.from('posts').select('*').eq('id', postId).single();
          if (error) throw error;
          const post = data ? mapDbPostToBlogPost(data) : null;
          return new Response(JSON.stringify(post), { status: 200 });
      }
      case 'getAllPosts': {
          const { data, error } = await supabase.from('posts').select('id, title, topic').order('created_at', { ascending: false });
          if (error) throw error;
          const posts = data.map(p => ({ post: { id: p.id, title: p.title, topic: p.topic }, topic: p.topic }));
          return new Response(JSON.stringify(posts), { status: 200 });
      }
      case 'searchAndGeneratePost': {
          const { topic } = payload;
          const [newPost] = await generateAndSavePosts(topic, 1);
          return new Response(JSON.stringify(newPost), { status: 200 });
      }
       case 'getRelatedPosts': {
          const { keywords, currentPostId } = payload;
          const posts = await generateAndSavePosts(keywords.join(', '), 3, currentPostId);
          return new Response(JSON.stringify(posts), { status: 200 });
      }
      case 'createPost': {
          const { post } = payload;
          const newPost: BlogPost = {
              ...post,
              id: `custom-${new Date().getTime()}`,
              author: defaultAuthor,
              sources: [],
              created_at: new Date().toISOString(),
          };
          const { data, error } = await supabase.from('posts').insert(mapBlogPostToDbPost(newPost)).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(mapDbPostToBlogPost(data)), { status: 201 });
      }
      case 'updatePost': {
          const { post } = payload;
          const { data, error } = await supabase.from('posts').update(mapBlogPostToDbPost(post)).eq('id', post.id).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(mapDbPostToBlogPost(data)), { status: 200 });
      }
      case 'deletePost': {
          const { postId } = payload;
          const { error } = await supabase.from('posts').delete().eq('id', postId);
          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      // --- COMMENTS ---
      case 'getComments': {
          const { postId } = payload;
          const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
          if (error) throw error;
          return new Response(JSON.stringify(data), { status: 200 });
      }
      case 'getAllComments': {
          const { data, error } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return new Response(JSON.stringify(data), { status: 200 });
      }
      case 'addComment': {
          const { comment } = payload;
          const newComment = {
              ...comment,
              id: `comment-${new Date().getTime()}`,
              post_id: comment.postId, // Map to db column
          };
          delete newComment.postId;

          const { data, error } = await supabase.from('comments').insert(newComment).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { status: 201 });
      }
       case 'updateCommentStatus': {
          const { commentId, status } = payload;
          const { data, error } = await supabase.from('comments').update({ status }).eq('id', commentId).select().single();
          if (error) throw error;
          return new Response(JSON.stringify(data), { status: 200 });
      }
      
      // --- OTHER GEMINI ---
      case 'findYouTubeVideoId': {
          const { query } = payload;
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Find a YouTube video ID for: "${query}"`, config: { responseMimeType: "application/json", responseSchema: youtubeVideoIdSchema } });
          const result = JSON.parse(response.text);
          return new Response(JSON.stringify(result.videoId || null), { status: 200 });
      }
      case 'extractKeywordsFromContent': {
          const { content } = payload;
          const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: `Extract 3-5 keywords from: "${content.substring(0, 1000)}..."`, config: { responseMimeType: "application/json", responseSchema: keywordSchema } });
          const result = JSON.parse(response.text);
          return new Response(JSON.stringify(result.tags || []), { status: 200 });
      }

      // --- CRON JOB / AGENT ---
      case 'seedNewContent': {
          // 1. Ensure Plutowealth article exists
          const { data: existing } = await supabase.from('posts').select('id').eq('id', plutowealthArticleData.id).single();
          if (!existing) {
              const { error: insertError } = await supabase.from('posts').insert(mapBlogPostToDbPost({ ...plutowealthArticleData, created_at: new Date().toISOString() }));
              if (insertError) console.error("Failed to insert Plutowealth article:", insertError);
          }
          
          // 2. Generate new articles for 3 random topics to keep the blog fresh.
          const topicsToSeed = new Set<string>();
          while(topicsToSeed.size < 3 && topicsToSeed.size < TOPICS.length) {
              const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
              topicsToSeed.add(randomTopic);
          }

          for (const topic of Array.from(topicsToSeed)) {
              console.log(`Seeding new content for topic: ${topic}`);
              await generateAndSavePosts(topic, 5);
          }
          
          return new Response(JSON.stringify({ success: true, seededTopics: Array.from(topicsToSeed) }), { status: 200 });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
    }
  } catch (error: any) {
    console.error("Error in serverless API:", error);
    return new Response(JSON.stringify({ error: error.message || "An internal server error occurred." }), { status: 500 });
  }
}

// Handler for Vercel Cron Jobs (or other services that send GET requests)
// This allows a simple GET request to trigger the content seeding.
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        // Basic security check: ensure the request is for the cron endpoint.
        // For higher security, you could add a secret key to the cron job URL.
        if (url.pathname.endsWith('/api/cron') || url.pathname.endsWith('/api')) {
            // Simulate the POST request structure for our handler
            const syntheticRequest = new Request(request.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'seedNewContent', payload: {} }),
            });
            return POST(syntheticRequest);
        }
        return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    } catch (error: any) {
        console.error("Error in GET handler for cron:", error);
        return new Response(JSON.stringify({ error: error.message || "An internal server error occurred." }), { status: 500 });
    }
}