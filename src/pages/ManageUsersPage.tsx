import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { usersAPI } from '@/lib/api';

export default function ManageUsersPage() {
  const { isAdmin } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');

  if (!isAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersRes = await usersAPI.getAll();
      const transformedUsers = usersRes.data.map((u: any) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role || 'user',
        createdAt: u.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      }));
      setUsersList(transformedUsers);
    } catch (error) {
      setUsersList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (id: string, username: string) => {
    if (!window.confirm(`Delete user ${username}?`)) return;
    try {
      await usersAPI.delete(id);
      setUsersList((p) => p.filter((user) => user.id !== id));
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  // Filter users based on search query and role filter
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> MANAGE USERS
        </h1>
        <p className="text-muted-foreground font-mono text-sm">MANAGE USER ACCOUNTS AND ROLES</p>
      </div>

      {/* Search and Filter Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Search Input */}
        <div className="neu-input w-full px-4 py-3 text-foreground border-2 border-foreground flex items-center gap-2"
          style={{ boxShadow: '2px 2px 0px #000' }}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-sm"
          />
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-bold uppercase tracking-wider self-center">Filter:</span>
          <button
            onClick={() => setFilterRole('all')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              filterRole === 'all'
                ? 'bg-primary text-primary-foreground border-foreground'
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={filterRole === 'all' ? { boxShadow: '2px 2px 0px #000' } : {}}
          >
            All Users ({usersList.length})
          </button>
          <button
            onClick={() => setFilterRole('admin')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              filterRole === 'admin'
                ? 'bg-primary text-primary-foreground border-foreground'
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={filterRole === 'admin' ? { boxShadow: '2px 2px 0px #000' } : {}}
          >
            Admins ({usersList.filter((u) => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setFilterRole('user')}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              filterRole === 'user'
                ? 'bg-primary text-primary-foreground border-foreground'
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={filterRole === 'user' ? { boxShadow: '2px 2px 0px #000' } : {}}
          >
            Regular Users ({usersList.filter((u) => u.role === 'user').length})
          </button>
        </div>
      </motion.div>

      {/* Users List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase tracking-wider">
          {filteredUsers.length} {filterRole === 'all' ? 'Users' : filterRole === 'admin' ? 'Admins' : 'Regular Users'}
        </h3>
        {filteredUsers.length === 0 ? (
          <div className="neu-card p-8 text-center text-muted-foreground">
            {searchQuery ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filteredUsers.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="neu-card p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="w-12 h-12 bg-primary border-2 border-foreground flex items-center justify-center shrink-0"
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    <span className="text-primary-foreground font-bold">
                      {u.username[0]?.toUpperCase() ||
                        u.email[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold">{u.username}</h4>
                    <p className="text-sm text-muted-foreground font-mono">
                      {u.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined: {u.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
                      u.role === 'admin'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-accent-cyan text-background border-accent-cyan'
                    }`}
                    style={{ boxShadow: '2px 2px 0px #000' }}
                  >
                    {u.role}
                  </span>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => deleteUser(u.id, u.username)}
                      className="p-2 hover:bg-destructive/10 cursor-pointer border border-destructive/30 hover:border-destructive transition-all"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
