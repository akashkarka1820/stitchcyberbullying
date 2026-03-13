import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Ban, Zap, Globe, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 p-4 px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-primary w-8 h-8" />
          <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">SafeSpace</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/login" className="text-slate-600 dark:text-slate-400 text-sm font-bold px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1">
            Admin Login
          </Link>
          <Link to="/login" className="text-slate-600 dark:text-slate-400 text-sm font-bold px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">Login</Link>
          <Link to="/register" className="bg-primary text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-opacity-90 transition-opacity">Register</Link>
        </div>
      </nav>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-8 md:w-1/2"
          >
            <div className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit text-sm font-semibold">
                <Zap className="w-4 h-4" />
                Powered by Advanced AI Moderation
              </div>
              <h1 className="text-slate-900 dark:text-slate-100 text-5xl font-black leading-[1.1] tracking-tight md:text-6xl">
                A safer way to <span className="text-primary">connect</span> online.
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-normal leading-relaxed max-w-xl">
                SafeSpace uses industry-leading AI to protect your conversations. Experience a platform where community values and security come first. No bots, no hate, just human connection.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-primary text-white text-lg font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Get Started
              </Link>
              <Link to="/login" className="flex min-w-[160px] cursor-pointer items-center justify-center rounded-xl h-14 px-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Login
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full md:w-1/2 relative"
          >
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 -z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80" 
              alt="Diverse group of people" 
              className="w-full aspect-square object-cover rounded-2xl shadow-2xl border-8 border-white dark:border-slate-800"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 py-20 px-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <div className="flex flex-col gap-4 text-center items-center">
              <h2 className="text-slate-900 dark:text-slate-100 text-4xl font-black tracking-tight">Why SafeSpace?</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-normal max-w-[720px]">
                We prioritize your well-being with industry-leading technology and community-driven values.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: ShieldCheck, title: "AI Moderation", desc: "Our advanced neural networks filter harmful content, spam, and harassment in real-time before you ever see it." },
                { icon: Lock, title: "Privacy First", desc: "End-to-end encryption for your messages. Your data belongs to you, and we never sell your personal information." },
                { icon: Ban, title: "Zero Tolerance", desc: "We maintain a strict policy against harassment and cyberbullying to keep our community positive for everyone." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -5 }}
                  className="flex flex-col gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark p-8 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 px-6 py-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary w-6 h-6" />
              <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold">SafeSpace</h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <a href="#" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary">Privacy Policy</a>
              <a href="#" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary">Terms of Service</a>
              <a href="#" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary">Community Guidelines</a>
              <a href="#" className="text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-primary">Contact Us</a>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© 2024 SafeSpace. All rights reserved.</p>
            <div className="flex gap-4">
              <Globe className="w-5 h-5 text-slate-400 hover:text-primary cursor-pointer" />
              <Share2 className="w-5 h-5 text-slate-400 hover:text-primary cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
