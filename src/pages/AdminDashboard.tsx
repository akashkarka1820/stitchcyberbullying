import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, MessageSquare, AlertTriangle, TrendingUp, ChevronRight, Search, Filter, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Post, Violation } from '../types';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalViolations: 0,
    activeStrikes: 0
  });
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd have a dedicated stats endpoint
    // For now, we'll fetch posts and violations to mock it
    const fetchData = async () => {
      try {
        const [postsRes, violationsRes] = await Promise.all([
          fetch('/api/posts'),
          fetch('/api/user/1/strikes') // Mocking for demo
        ]);
        
        const posts = await postsRes.json();
        const violations = await violationsRes.json();
        
        setStats({
          totalUsers: 1240,
          totalPosts: posts.length,
          totalViolations: 45,
          activeStrikes: 12
        });
        setRecentViolations(violations);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ShieldAlert className="text-red-500 w-8 h-8" />
          <h1 className="text-xl font-bold text-white">SafeSpace</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold">
            <TrendingUp className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
            <Users className="w-5 h-5" />
            User Management
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
            <MessageSquare className="w-5 h-5" />
            Content Moderation
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all">
            <AlertTriangle className="w-5 h-5" />
            System Logs
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-all">
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search users, posts, or violations..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-white">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-500 size-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white">3</span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right">
                <p className="text-sm font-bold text-white">{user.full_name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-widest">System Admin</p>
              </div>
              <div className="size-10 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">System Overview</h2>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm hover:bg-slate-800 transition-all">
                <Filter className="w-4 h-4" />
                Last 24 Hours
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all">
                Generate Report
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
              { label: 'Total Posts', value: stats.totalPosts, icon: MessageSquare, color: 'green' },
              { label: 'AI Violations', value: stats.totalViolations, icon: AlertTriangle, color: 'amber' },
              { label: 'Active Strikes', value: stats.activeStrikes, icon: ShieldAlert, color: 'red' }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-green-500 text-xs font-bold">+12%</span>
                </div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Recent Violations */}
            <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-white">Recent AI Flagged Content</h3>
                <button className="text-red-500 text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="divide-y divide-slate-800">
                {loading ? (
                  <div className="p-12 text-center text-slate-500">Loading violations...</div>
                ) : (
                  recentViolations.map((v) => (
                    <div key={v.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-all">
                      <div className="size-10 rounded-full bg-slate-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${v.user_id}`} alt="User" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">User #{v.user_id}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold uppercase tracking-wider">{v.type}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-md">"{v.content_preview}"</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{new Date(v.timestamp).toLocaleTimeString()}</p>
                        <button className="text-xs font-bold text-red-500 hover:underline mt-1">Review</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white mb-6">AI Moderation Health</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Accuracy Rate</span>
                    <span className="text-white font-bold">98.4%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[98.4%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Response Time</span>
                    <span className="text-white font-bold">142ms</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[85%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">False Positives</span>
                    <span className="text-white font-bold">0.2%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[5%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  <span className="text-sm font-bold text-white">System Alert</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Increased activity detected in "Politics" topic. AI sensitivity adjusted to level 4.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
