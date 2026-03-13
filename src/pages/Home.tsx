import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Bell, Heart, MessageCircle, Share2, Bookmark, PlusSquare, Home as HomeIcon, User as UserIcon, MoreHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Post } from '../types';

interface HomeProps {
  user: User;
  onLogout: () => void;
}

export default function Home({ user, onLogout }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 justify-between border-b border-primary/10">
        <div className="flex items-center gap-2">
          <div className="text-primary flex size-10 shrink-0 items-center justify-center bg-primary/10 rounded-lg">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">SafeSpace</h2>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-600 dark:text-slate-400">
            <Bell className="w-6 h-6" />
          </button>
          <Link to="/profile" className="size-9 rounded-full bg-primary/20 border-2 border-primary/40 overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
              alt="User profile" 
              referrerPolicy="no-referrer"
            />
          </Link>
        </div>
      </header>

      {/* Stories Section (Mock) */}
      <div className="flex w-full overflow-x-auto scrollbar-hide px-4 py-4 gap-4 bg-white dark:bg-slate-900/50">
        <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
          <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary to-blue-400">
            <div className="bg-white dark:bg-background-dark p-0.5 rounded-full">
              <div className="size-14 rounded-full bg-slate-200 overflow-hidden">
                <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Your Story" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
          <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Your Story</p>
        </div>
        {['Alex', 'Jordan', 'Taylor', 'Casey'].map((name) => (
          <div key={name} className="flex flex-col items-center gap-1.5 min-w-[72px]">
            <div className="relative p-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="bg-white dark:bg-background-dark p-0.5 rounded-full">
                <div className="size-14 rounded-full bg-slate-200 overflow-hidden">
                  <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt={name} referrerPolicy="no-referrer" />
                </div>
              </div>
            </div>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{name}</p>
          </div>
        ))}
      </div>

      {/* Main Feed */}
      <main className="flex-1 max-w-2xl mx-auto w-full pb-20">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          posts.map((post) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-white dark:bg-slate-900 border-y border-primary/5"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-slate-200 overflow-hidden">
                    <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`} alt={post.username} referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{post.username}</p>
                    <p className="text-xs text-slate-500">{post.location}</p>
                  </div>
                </div>
                <button className="text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
              </div>
              <div className="w-full aspect-square bg-slate-100 overflow-hidden">
                <img className="w-full h-full object-cover" src={post.image_url} alt="Post content" referrerPolicy="no-referrer" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Heart className="w-7 h-7" />
                      <span className="text-sm font-bold">{post.likes_count}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <MessageCircle className="w-7 h-7" />
                      <span className="text-sm font-bold">{post.comments_count}</span>
                    </button>
                    <button className="text-slate-700 dark:text-slate-300">
                      <Share2 className="w-7 h-7" />
                    </button>
                  </div>
                  <button className="text-slate-700 dark:text-slate-300">
                    <Bookmark className="w-7 h-7" />
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    <span className="font-bold mr-2">{post.username}</span>
                    {post.content}
                  </p>
                  <button className="text-xs text-slate-500 font-medium mt-1">View all {post.comments_count} comments</button>
                </div>
                
                {/* AI Protected Comment Input */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="relative group">
                    <input 
                      className="w-full pl-4 pr-32 py-2.5 bg-background-light dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" 
                      placeholder="Add a positive comment..." 
                      type="text"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">AI Guarded</span>
                      </div>
                      <button className="text-primary font-bold text-sm px-2">Post</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-primary/10">
        <div className="flex items-center justify-around max-w-2xl mx-auto px-2 py-2">
          <Link to="/home" className="flex flex-col items-center gap-0.5 p-2 text-primary">
            <HomeIcon className="w-6 h-6" />
            <span className="text-[10px] font-bold">Home</span>
          </Link>
          <Link to="/new-post" className="flex flex-col items-center gap-0.5 p-2">
            <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/30">
              <PlusSquare className="w-6 h-6" />
            </div>
          </Link>
          <Link to="/safety" className="flex flex-col items-center gap-0.5 p-2 text-slate-500 dark:text-slate-400">
            <Shield className="w-6 h-6" />
            <span className="text-[10px] font-medium">Safety</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-0.5 p-2 text-slate-500 dark:text-slate-400">
            <UserIcon className="w-6 h-6" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
