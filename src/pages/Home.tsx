import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Bell, Heart, MessageCircle, Share2, Bookmark, PlusSquare, Home as HomeIcon, User as UserIcon, MoreHorizontal, Sparkles, AlertTriangle, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Post, Comment } from '../types';

interface HomeProps {
  user: User;
  onLogout: () => void;
}

export default function Home({ user, onLogout }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<Record<number, string>>({});
  const [commentWarning, setCommentWarning] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, Comment[]>>({});
  const [showComments, setShowComments] = useState<Record<number, boolean>>({});
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  const handleLike = async (postId: number) => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    });
    const data = await res.json();
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (data.liked ? 1 : -1) }
          : p
      )
    );
    setLikedPosts(prev => {
      const next = new Set(prev);
      data.liked ? next.add(postId) : next.delete(postId);
      return next;
    });
  };

  const loadComments = async (postId: number) => {
    const res = await fetch(`/api/posts/${postId}/comments`);
    const data = await res.json();
    setExpandedComments(prev => ({ ...prev, [postId]: data }));
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleComment = async (postId: number) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    setSubmitting(prev => ({ ...prev, [postId]: true }));
    setCommentWarning(prev => ({ ...prev, [postId]: '' }));

    // Helper to show a comment locally as flagged without saving it
    const showFakeBlockedComment = (warningMessage: string) => {
      const fakeComment = {
        id: Date.now(), // temporary local ID
        content: text,
        username: user.username,
        is_flagged: 1,
        created_at: new Date().toISOString()
      };
      
      setExpandedComments(prev => ({
        ...prev,
        [postId]: [fakeComment, ...(prev[postId] || [])],
      }));
      // Ensure comments section is visible to see it
      setShowComments(prev => ({ ...prev, [postId]: true }));
      // Show strike warning
      setCommentWarning(prev => ({
        ...prev,
        [postId]: '⚠ ' + warningMessage,
      }));
      setCommentText(prev => ({ ...prev, [postId]: '' }));
    };

    try {
      // ─── STEP 1: Frontend pre-check with ML API ─────────────────────
      let mlBlocked = false;
      try {
        const mlRes = await fetch('/api/comments/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (mlData.is_cyberbullying) {
            mlBlocked = true;
            showFakeBlockedComment('This content contains cyberbullying. A strike has been added to your account.');
          }
        }
      } catch {
        // Fall through to backend validation
      }

      if (mlBlocked) {
        // Still need to trigger the backend to actually record the strike
        fetch(`/api/posts/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, content: text }),
        }).catch(() => {});
        return;
      }

      // ─── STEP 2: Submit to backend ──────────────────────────────────
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, content: text }),
      });
      const data = await res.json();

      if (res.status === 403) {
        setCommentWarning(prev => ({ ...prev, [postId]: data.error }));
        return;
      }

      if (data.blocked) {
        showFakeBlockedComment('This content contains cyberbullying. A strike has been added to your account.');
        return;
      }

      // ─── Safe comment accepted ──────────────────────────────────────
      setCommentWarning(prev => ({ ...prev, [postId]: '' }));
      setCommentText(prev => ({ ...prev, [postId]: '' }));

      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        )
      );

      if (showComments[postId] && data.comment) {
        setExpandedComments(prev => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])],
        }));
      }
    } catch (err) {
      setCommentWarning(prev => ({ ...prev, [postId]: 'Failed to post comment. Please try again.' }));
    } finally {
      setSubmitting(prev => ({ ...prev, [postId]: false }));
    }
  };

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
              {post.image_url && (
                <div className="w-full aspect-square bg-slate-100 overflow-hidden">
                  <img className="w-full h-full object-cover" src={post.image_url} alt="Post content" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${likedPosts.has(post.id) ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <Heart className={`w-7 h-7 ${likedPosts.has(post.id) ? 'fill-red-500' : ''}`} />
                      <span className="text-sm font-bold">{post.likes_count}</span>
                    </button>
                    <button 
                      onClick={() => loadComments(post.id)}
                      className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                    >
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
                  <button 
                    onClick={() => loadComments(post.id)}
                    className="text-xs text-slate-500 font-medium mt-1"
                  >
                    {showComments[post.id] ? 'Hide comments' : `View all ${post.comments_count} comments`}
                  </button>
                </div>

                {/* Expanded Comments */}
                <AnimatePresence>
                  {showComments[post.id] && expandedComments[post.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2 max-h-60 overflow-y-auto"
                    >
                      {expandedComments[post.id].length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first!</p>
                      ) : (
                        expandedComments[post.id].map((comment) => (
                          <div key={comment.id} className={`flex gap-2 p-2 rounded-lg ${comment.is_flagged ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800' : ''}`}>
                            <div className="size-6 rounded-full bg-slate-200 overflow-hidden shrink-0 mt-0.5">
                              <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.username}`} alt={comment.username} referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-800 dark:text-slate-200">
                                <span className="font-bold mr-1">{comment.username}</span>
                                {comment.content}
                              </p>
                              {!!comment.is_flagged && (
                                <div className="flex items-center gap-1 mt-1">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <span className="text-[10px] text-red-500 font-medium">Flagged as harmful</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Warning Message */}
                <AnimatePresence>
                  {commentWarning[post.id] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-xl flex items-start gap-2"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300 font-bold flex-1">{commentWarning[post.id]}</p>
                      <button onClick={() => setCommentWarning(prev => ({ ...prev, [post.id]: '' }))} className="text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Protected Comment Input */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="relative group">
                    <input 
                      className="w-full pl-4 pr-32 py-2.5 bg-background-light dark:bg-background-dark border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" 
                      placeholder="Add a positive comment..." 
                      type="text"
                      value={commentText[post.id] || ''}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !submitting[post.id]) handleComment(post.id);
                      }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">AI Guarded</span>
                      </div>
                      <button 
                        onClick={() => handleComment(post.id)}
                        disabled={submitting[post.id] || !commentText[post.id]?.trim()}
                        className="text-primary font-bold text-sm px-2 disabled:opacity-50"
                      >
                        {submitting[post.id] ? '...' : <Send className="w-4 h-4" />}
                      </button>
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
