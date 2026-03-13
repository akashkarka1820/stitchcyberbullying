import { useNavigate, Link } from 'react-router-dom';
import { Settings, LogOut, ShieldCheck, ChevronRight, Grid, List, Heart, Plus, Home, Compass, Shield, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

export default function Profile({ user, onLogout }: ProfileProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 min-h-screen flex flex-col shadow-xl">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400 cursor-pointer" />
        <h1 className="text-lg font-bold tracking-tight">SafeSpace</h1>
        <button onClick={handleLogout} className="flex items-center justify-center p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <LogOut className="w-6 h-6 text-slate-600 dark:text-slate-400" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <section className="p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="size-28 rounded-full border-4 border-primary/20 p-1">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                alt="Profile" 
                className="size-full rounded-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-white size-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">{user.full_name}</h2>
          <p className="text-primary font-medium text-sm mb-2">@{user.username}</p>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xs">
            Spreading positivity and building a safer community for everyone. ✨ SafeSpace Ambassador.
          </p>
        </section>

        <section className="px-4 mb-6">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm uppercase tracking-wider">Community Standing</span>
              </div>
              <span className="text-sm font-semibold bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-primary/20">
                {user.strikes} / 3 Strikes
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${(user.strikes / 3) * 100}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {user.strikes === 0 ? "Perfect standing! Your account is safe." : "Good standing. Follow community guidelines to keep it this way."}
            </p>
            <div className="mt-3 pt-3 border-t border-primary/10">
              <Link to="/strikes" className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity">
                View Strike History
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 mb-8">
          <Link to="/new-post" className="w-full group relative flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">Share a new moment</span>
            <span className="text-sm text-slate-500">Post photos and connect with others</span>
          </Link>
        </section>

        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">My Gallery</h3>
            <div className="flex gap-2">
              <button className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-primary">
                <Grid className="w-5 h-5" />
              </button>
              <button className="p-1.5 rounded text-slate-400">
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden group cursor-pointer relative">
                <img 
                  src={`https://picsum.photos/seed/profile-${i}/400/400`} 
                  alt="Post" 
                  className="size-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 pb-6 pt-2 z-20">
        <div className="flex items-center justify-between">
          <Link to="/home" className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary">
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link to="/home" className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary">
            <Compass className="w-6 h-6" />
            <span className="text-[10px] font-medium">Explore</span>
          </Link>
          <Link to="/new-post" className="flex flex-col items-center -mt-8">
            <div className="bg-primary text-white p-3 rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
          </Link>
          <Link to="/safety" className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary">
            <Shield className="w-6 h-6" />
            <span className="text-[10px] font-medium">Safety</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-1 text-primary">
            <UserIcon className="w-6 h-6 fill-primary" />
            <span className="text-[10px] font-bold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
