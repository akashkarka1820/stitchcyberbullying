import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Filter, MoreVertical, ShieldAlert, UserX, CheckCircle, Mail, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock user list
    const mockUsers: User[] = [
      { id: 1, full_name: 'Akash Karka', email: 'akash@example.com', username: 'akash', role: 'admin', strikes: 0, status: 'active', joined_at: new Date().toISOString() },
      { id: 2, full_name: 'John Doe', email: 'john@example.com', username: 'johndoe', role: 'user', strikes: 1, status: 'active', joined_at: new Date().toISOString() },
      { id: 3, full_name: 'Jane Smith', email: 'jane@example.com', username: 'janesmith', role: 'user', strikes: 0, status: 'active', joined_at: new Date().toISOString() },
      { id: 4, full_name: 'Bad Actor', email: 'bad@example.com', username: 'troll123', role: 'user', strikes: 2, status: 'active', joined_at: new Date().toISOString() },
      { id: 5, full_name: 'Alice Cooper', email: 'alice@example.com', username: 'alice', role: 'user', strikes: 0, status: 'active', joined_at: new Date().toISOString() },
    ];
    
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 500);
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <header className="h-20 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold text-white">User Management</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>
          <button className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Strikes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading user database...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users found matching your search.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/30 transition-all group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="w-full h-full" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{user.full_name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`size-2 rounded-full ${i <= user.strikes ? 'bg-red-500' : 'bg-slate-700'}`}></div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.strikes >= 3 ? (
                          <>
                            <UserX className="w-4 h-4 text-red-500" />
                            <span className="text-xs text-red-500 font-medium">Suspended</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-500 font-medium">Active</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white" title="Send Warning">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500" title="Issue Strike">
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-500" title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
