import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Users, MessageSquare, AlertTriangle, TrendingUp, Search, Filter, Bell, LogOut, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Violation } from '../types';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalViolations: 0,
    flaggedComments: 0,
    activeStrikes: 0,
    blockedUsers: 0,
    detectionRate: 0,
  });
  const [recentViolations, setRecentViolations] = useState<Violation[]>([]);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, violationsRes, metricsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/violations'),
          fetch('/api/admin/model-metrics'),
        ]);

        const statsData = await statsRes.json();
        const violationsData = await violationsRes.json();
        
        setStats(statsData);
        setRecentViolations(violationsData.slice(0, 10));

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setModelMetrics(metricsData);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
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
              {stats.totalViolations > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 size-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                  {stats.totalViolations > 9 ? '9+' : stats.totalViolations}
                </span>
              )}
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
              { label: 'Blocked Users', value: stats.blockedUsers, icon: ShieldAlert, color: 'red' }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-green-500 text-xs font-bold">Live</span>
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
                <span className="text-sm text-slate-500">{stats.flaggedComments} total flagged</span>
              </div>
              <div className="divide-y divide-slate-800">
                {loading ? (
                  <div className="p-12 text-center text-slate-500">Loading violations...</div>
                ) : recentViolations.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">No violations recorded yet. The AI moderation system is active.</div>
                ) : (
                  recentViolations.map((v) => (
                    <div key={v.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-all">
                      <div className="size-10 rounded-full bg-slate-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${v.username || `user${v.user_id}`}`} alt="User" className="w-full h-full" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{v.username || `User #${v.user_id}`}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full font-bold uppercase tracking-wider">{v.type}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-md">"{v.content_preview}"</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">{v.action_taken}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{new Date(v.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Model Health & Comparison */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white">AI Moderation Comparison</h3>
                <button 
                  onClick={async () => {
                    const btn = document.getElementById('retrain-btn');
                    if (btn) (btn as HTMLButtonElement).disabled = true;
                    setStats(prev => ({ ...prev, detectionRate: 0 })); // Reset UI indicator
                    
                    try {
                      const res = await fetch('/api/admin/model-retrain', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok) {
                        setModelMetrics(data.metrics);
                      } else {
                        alert("❌ Training failed: " + data.error);
                      }
                    } catch (err) {
                      alert("❌ Connection error.");
                    } finally {
                      if (btn) (btn as HTMLButtonElement).disabled = false;
                    }
                  }}
                  id="retrain-btn"
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                >
                  <TrendingUp className="w-4 h-4" />
                  Rerun All Algorithms
                </button>
              </div>

              <div className="space-y-6">
                {modelMetrics?.all_results ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 uppercase">
                          <th className="pb-3 pr-2">Algorithm</th>
                          <th className="pb-3 px-2">Accuracy</th>
                          <th className="pb-3 px-2">F1 Score</th>
                          <th className="pb-3 px-2">Precision</th>
                          <th className="pb-3 pl-2">Recall</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {Object.entries(modelMetrics.all_results).map(([algo, m]: any) => (
                          <tr key={algo} className={algo === modelMetrics.best_model ? "text-primary font-bold bg-primary/5" : "text-slate-400"}>
                            <td className="py-3 pr-2 flex items-center gap-2">
                              {algo}
                              {algo === modelMetrics.best_model && <span className="text-[8px] bg-primary text-white px-1 rounded uppercase">Best</span>}
                            </td>
                            <td className="py-3 px-2">{(m.accuracy * 100).toFixed(1)}%</td>
                            <td className="py-3 px-2">{(m.f1_score * 100).toFixed(1)}%</td>
                            <td className="py-3 px-2">{(m.precision * 100).toFixed(1)}%</td>
                            <td className="py-3 pl-2">{(m.recall * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-500 italic">
                    Loading model comparison data...
                  </div>
                )}
              </div>

              <div className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  <span className="text-sm font-bold text-white">System Status</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  AI moderation is active. Best model (<span className="text-primary font-bold">{modelMetrics?.best_model || 'Loading...'}</span>) is currently guarding {stats.totalComments} comments analyzed across {stats.totalPosts} posts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
