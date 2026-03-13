import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Check, ShieldCheck, Users, MessageSquare, BookOpen, Headset, Home, Shield, History, HelpCircle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface SafetyHubProps {
  user: User;
}

export default function SafetyHub({ user }: SafetyHubProps) {
  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark shadow-xl overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800">
        <Link to="/home" className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-display">Safety Hub</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-lg h-12 bg-transparent text-slate-900 dark:text-slate-100 p-0">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Safety Profile Section */}
      <div className="flex p-6 flex-col items-center bg-gradient-to-b from-white to-background-light dark:from-slate-900 dark:to-background-dark">
        <div className="relative mb-4">
          <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 border-4 border-white dark:border-slate-800 shadow-sm overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Profile" className="w-full h-full" referrerPolicy="no-referrer" />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-green-500 h-6 w-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
            <Check className="text-white w-3 h-3 font-bold" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-slate-900 dark:text-white text-2xl font-bold font-display">Safety Status: Protected</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Your privacy controls are working effectively</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Last checked: 2 mins ago</p>
        </div>
      </div>

      {/* Risk Level Meter */}
      <div className="px-4 py-2">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-slate-900 dark:text-white text-base font-bold font-display">Current Risk Level</h3>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">LOW</span>
          </div>
          <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '15%' }}
              className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
            ></motion.div>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-slate-500 dark:text-slate-400 text-xs">Safe</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">High Risk</p>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-3 flex items-center gap-2">
            <ShieldCheck className="text-green-500 w-5 h-5" />
            No immediate threats detected in your network.
          </p>
        </div>
      </div>

      {/* Quick Actions / Features */}
      <div className="px-4 pt-4 grid grid-cols-1 gap-3">
        <button className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="h-10 w-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-slate-900 dark:text-white text-sm">Blocked Users</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">12 accounts currently restricted</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="h-10 w-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-slate-900 dark:text-white text-sm">Moderated Comments</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">8 harmful messages filtered</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>

        <button className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-slate-900 dark:text-white text-sm">Support Resources</p>
            <p className="text-slate-500 dark:text-slate-400 text-xs">Articles and guides on digital safety</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Counselor Prompt */}
      <div className="px-4 py-6">
        <div className="bg-primary/5 dark:bg-primary/10 border-2 border-dashed border-primary/30 dark:border-primary/40 rounded-xl p-6 flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white mb-4">
            <Headset className="w-6 h-6" />
          </div>
          <h4 className="text-slate-900 dark:text-white font-bold text-lg font-display">Need help?</h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">You're not alone. Professional counselors are available 24/7 to listen and support you.</p>
          <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors">
            Speak to a Counselor
          </button>
        </div>
      </div>

      <div className="flex-grow"></div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 w-full flex gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pb-4 pt-2">
        <Link className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500" to="/home">
          <div className="flex h-8 items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Home</p>
        </Link>
        <Link className="flex flex-1 flex-col items-center justify-end gap-1 text-primary" to="/safety">
          <div className="flex h-8 items-center justify-center">
            <Shield className="w-6 h-6 fill-primary" />
          </div>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Safety</p>
        </Link>
        <Link className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500" to="/profile">
          <div className="flex h-8 items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Activity</p>
        </Link>
        <Link className="flex flex-1 flex-col items-center justify-end gap-1 text-slate-400 dark:text-slate-500" to="/profile">
          <div className="flex h-8 items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium leading-normal tracking-[0.015em]">Support</p>
        </Link>
      </div>
    </div>
  );
}
