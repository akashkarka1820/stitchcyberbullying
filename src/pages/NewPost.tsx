import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Sparkles, ShieldCheck, AlertCircle, Send, X, MapPin, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { User } from '../types';

interface NewPostProps {
  user: User;
}

export default function NewPost({ user }: NewPostProps) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isModerating, setIsModerating] = useState(false);
  const [moderationResult, setModerationResult] = useState<{ safe: boolean; reason?: string } | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const moderateContent = async (text: string) => {
    setIsModerating(true);
    setModerationResult(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following social media post for harmful content (hate speech, bullying, harassment, violence, or explicit content). 
        Post: "${text}"
        
        Respond in JSON format with:
        {
          "safe": boolean,
          "reason": "string explaining why if unsafe, or a positive encouragement if safe"
        }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              safe: { type: Type.BOOLEAN },
              reason: { type: Type.STRING }
            },
            required: ["safe", "reason"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"safe": false, "reason": "AI analysis failed"}');
      setModerationResult(result);
      return result;
    } catch (err) {
      console.error("Moderation error:", err);
      setError("AI Moderation failed. Please try again.");
      return { safe: false, reason: "Service unavailable" };
    } finally {
      setIsModerating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const result = await moderateContent(content);
    
    if (result.safe) {
      // Proceed to save post
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            content,
            image_url: imageUrl || `https://picsum.photos/seed/${Date.now()}/800/800`,
            location: 'Global'
          }),
        });

        if (response.ok) {
          navigate('/home');
        } else {
          setError("Failed to save post");
        }
      } catch (err) {
        setError("Connection error");
      }
    } else {
      // Record violation
      await fetch('/api/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          type: 'harmful_content',
          content_preview: content.substring(0, 100)
        }),
      });
      // The user will see the moderation result in the UI
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col max-w-md mx-auto shadow-2xl">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/home" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold">New Post</h1>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={!content.trim() || isModerating}
          className="bg-primary disabled:opacity-50 text-white px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2"
        >
          {isModerating ? 'Checking...' : 'Post'}
          <Send className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <div className="flex gap-4">
          <div className="size-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Profile" className="w-full h-full" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1 space-y-4">
            <textarea 
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setModerationResult(null);
                setError('');
              }}
              placeholder="What's on your mind? (AI will check for safety)"
              className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[120px] placeholder:text-slate-400"
            />
            
            {imageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <img src={imageUrl} alt="Preview" className="w-full aspect-video object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isModerating && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col items-center text-center space-y-3"
            >
              <div className="relative">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-2 border-2 border-dashed border-primary/30 rounded-full"
                ></motion.div>
              </div>
              <h3 className="font-bold text-primary">AI Safety Check in Progress</h3>
              <p className="text-xs text-slate-500 max-w-[200px]">Our AI is ensuring your post follows community guidelines for a safer space.</p>
            </motion.div>
          )}

          {moderationResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 flex gap-4 ${moderationResult.safe ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}
            >
              <div className={`p-2 rounded-lg h-fit ${moderationResult.safe ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {moderationResult.safe ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h4 className={`font-bold ${moderationResult.safe ? 'text-green-800' : 'text-red-800'}`}>
                  {moderationResult.safe ? 'Safe to Post' : 'Safety Warning'}
                </h4>
                <p className={`text-sm ${moderationResult.safe ? 'text-green-600' : 'text-red-600'}`}>
                  {moderationResult.reason}
                </p>
                {!moderationResult.safe && (
                  <p className="text-xs text-red-500 mt-2 font-medium">
                    Posting harmful content may result in account strikes. Please revise your post.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setImageUrl(`https://picsum.photos/seed/${Date.now()}/800/800`)}
              className="text-primary hover:bg-primary/5 p-2 rounded-full transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            <button className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
              <MapPin className="w-6 h-6" />
            </button>
            <button className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
              <Smile className="w-6 h-6" />
            </button>
          </div>
          <div className="text-xs font-bold text-slate-400">
            {content.length} / 280
          </div>
        </div>
      </footer>
    </div>
  );
}
