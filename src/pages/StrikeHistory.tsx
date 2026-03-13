import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, Calendar, Info, AlertTriangle, CheckCircle2, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';
import { User, Violation } from '../types';

interface StrikeHistoryProps {
  user: User;
}

export default function StrikeHistory({ user }: StrikeHistoryProps) {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/user/${user.id}/strikes`)
      .then(res => res.json())
      .then(data => {
        setViolations(data);
        setLoading(false);
      });
  }, [user.id]);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col max-w-md mx-auto shadow-2xl">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
        <Link to="/profile" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold font-display">Strike History</h1>
      </header>

      <main className="flex-1 p-4 space-y-6">
        {/* Summary Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-full ${user.strikes > 0 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Account Standing</h2>
              <p className="text-sm text-slate-500">{user.strikes} active strikes out of 3</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-3 rounded-full ${i <= user.strikes ? 'bg-amber-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                ></div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Strikes are issued for content that violates our Community Guidelines. 3 strikes within 90 days will result in a permanent account suspension.
              </p>
            </div>
          </div>
        </div>

        {/* Violations List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Recent Violations</h3>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : violations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 flex flex-col items-center text-center border border-slate-100 dark:border-slate-800">
              <div className="bg-green-100 text-green-600 p-4 rounded-full mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-lg mb-1">Clean Record!</h4>
              <p className="text-sm text-slate-500">You haven't received any strikes. Keep up the positive contributions!</p>
            </div>
          ) : (
            violations.map((v) => (
              <motion.div 
                key={v.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex gap-4 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="bg-amber-50 text-amber-600 p-2 rounded-lg h-fit">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 dark:text-white capitalize">{v.type.replace('_', ' ')}</h4>
                    <button className="text-slate-400"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">"{v.content_preview}"</p>
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(v.timestamp).toLocaleDateString()}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded uppercase">Active</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Appeal Section */}
        <div className="pt-4">
          <button className="w-full py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors">
            Appeal a Strike
          </button>
          <p className="text-center text-xs text-slate-500 mt-4">
            Think we made a mistake? You can appeal any strike within 30 days of issuance.
          </p>
        </div>
      </main>
    </div>
  );
}
