import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Medal, Clock, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { quizzesAPI } from '@/lib/api';
import PageLoader from '@/components/PageLoader';

interface LeaderboardEntry {
  _id: string;
  userId: string;
  username: string;
  email?: string;
  points: number;
  timeSpent: number;
  completedAt: string;
  rank?: number;
}

interface QuizInfo {
  _id: string;
  title: string;
  topic: string;
  questions: Array<{ id: string }>;
}

export default function LeaderboardPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizInfo, setQuizInfo] = useState<QuizInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'top10' | 'today'>('all');

  useEffect(() => {
    if (!id) {
      setError('No quiz selected');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch quiz info
        const quizResponse = await quizzesAPI.getById(id);
        setQuizInfo(quizResponse.data);

        // Fetch leaderboard
        const response = await quizzesAPI.getLeaderboard(id);
        const data = response.data || [];

        if (!data || data.length === 0) {
          setLeaderboard([]);
          return;
        }

        // Add ranks - sort by points DESC, then by timeSpent ASC
        const sorted = [...data].sort(
          (a: LeaderboardEntry, b: LeaderboardEntry) => {
            if (b.points !== a.points) return b.points - a.points;
            return a.timeSpent - b.timeSpent;
          }
        );

        const withRanks = sorted.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          username: entry.username || entry.email || 'Anonymous',
          rank: index + 1,
        }));
        setLeaderboard(withRanks);
      } catch (err: any) {
        setError('Could not load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const filteredLeaderboard = () => {
    if (filterType === 'top10') {
      return leaderboard.slice(0, 10);
    }
    if (filterType === 'today') {
      return leaderboard.filter((entry) => isToday(entry.completedAt));
    }
    return leaderboard;
  };

  const filtered = filteredLeaderboard();
  const avgScore = leaderboard.length > 0 ? Math.round(
    leaderboard.reduce((sum, entry) => sum + entry.points, 0) / leaderboard.length
  ) : 0;
  const avgTime = leaderboard.length > 0 ? Math.round(
    leaderboard.reduce((sum, entry) => sum + entry.timeSpent, 0) / leaderboard.length
  ) : 0;
  const topScore = leaderboard.length > 0 ? leaderboard[0].points : 0;

  return (
    <div className="space-y-8 pb-12">
      <PageLoader isLoading={loading} message="Loading leaderboard..." />

      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/quizzes')}
        className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </motion.button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card-blue p-8 border-4 border-primary space-y-3"
      >
        <div className="flex items-center gap-3">
          <Trophy className="w-10 h-10 text-accent-yellow" />
          <div>
            <h1 className="text-4xl font-bold">{quizInfo?.title || 'Quiz Leaderboard'}</h1>
            <p className="text-muted-foreground font-mono text-sm">
              TOPIC: {quizInfo?.topic || 'N/A'} • {leaderboard.length} PARTICIPANTS
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="neu-card p-6 bg-destructive/10 border-2 border-destructive"
        >
          <p className="text-destructive font-semibold">{error}</p>
        </motion.div>
      )}

      {!error && leaderboard.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="neu-card p-12 text-center"
        >
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-xl text-muted-foreground font-mono">
            NO SUBMISSIONS YET • BE THE FIRST!
          </p>
        </motion.div>
      ) : (
        <>
          {/* Statistics Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-4 gap-4"
          >
            <div className="neu-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold font-mono text-sm">
                <Medal className="w-4 h-4" /> TOP SCORE
              </div>
              <p className="text-4xl font-bold text-accent-yellow">{topScore}%</p>
              <p className="text-xs text-muted-foreground">by {leaderboard[0]?.username}</p>
            </div>

            <div className="neu-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold font-mono text-sm">
                <TrendingUp className="w-4 h-4" /> AVG SCORE
              </div>
              <p className="text-4xl font-bold text-accent-lime">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">across all attempts</p>
            </div>

            <div className="neu-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold font-mono text-sm">
                <Clock className="w-4 h-4" /> AVG TIME
              </div>
              <p className="text-2xl font-bold text-accent-cyan">{formatTime(avgTime)}</p>
              <p className="text-xs text-muted-foreground">average completion</p>
            </div>

            <div className="neu-card p-6 space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold font-mono text-sm">
                <Trophy className="w-4 h-4" /> TOTAL
              </div>
              <p className="text-4xl font-bold text-accent-indigo">{leaderboard.length}</p>
              <p className="text-xs text-muted-foreground">total submissions</p>
            </div>
          </motion.div>

          {/* Filter Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2"
          >
            {[
              { name: 'All', value: 'all' as const },
              { name: 'Top 10', value: 'top10' as const },
              { name: "Today's", value: 'today' as const },
            ].map((filter) => (
              <motion.button
                key={filter.value}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterType(filter.value)}
                className={`px-6 py-3 font-bold text-sm tracking-wider border-2 cursor-pointer transition-all ${
                  filterType === filter.value
                    ? 'bg-accent-indigo text-white border-accent-indigo'
                    : 'bg-secondary text-foreground border-foreground hover:bg-accent-indigo/20'
                }`}
                style={{
                  boxShadow:
                    filterType === filter.value
                      ? '3px 3px 0px #6366F1'
                      : '2px 2px 0px #000',
                }}
              >
                {filter.name}
              </motion.button>
            ))}
          </motion.div>

          {/* Leaderboard Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-2xl font-bold uppercase tracking-wider">
              <span className="text-primary">»</span> Rankings
            </h2>

            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="neu-card p-6 text-center text-muted-foreground">
                  No entries match this filter
                </div>
              ) : (
                filtered.map((entry, index) => {
                  const medal = getMedalIcon(entry.rank || index + 1);
                  const isTopThree = (entry.rank || index + 1) <= 3;
                  return (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`neu-card p-5 flex items-center gap-4 transition-all hover:scale-102 ${
                        isTopThree
                          ? 'border-3 border-accent-yellow bg-accent-yellow/5'
                          : 'hover:border-primary'
                      }`}
                      style={
                        isTopThree
                          ? { boxShadow: '3px 3px 0px #FFD60A' }
                          : undefined
                      }
                    >
                      {/* Rank */}
                      <div
                        className={`w-14 h-14 flex-shrink-0 flex items-center justify-center text-2xl font-bold border-3 ${
                          isTopThree
                            ? 'bg-accent-yellow/20 border-accent-yellow'
                            : 'bg-secondary border-foreground'
                        }`}
                        style={{
                          boxShadow: isTopThree
                            ? '2px 2px 0px #FFD60A'
                            : '2px 2px 0px #000',
                        }}
                      >
                        {medal ? <span>{medal}</span> : `#${entry.rank || index + 1}`}
                      </div>

                      {/* User Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg truncate">{entry.username}</p>
                          {isTopThree && (
                            <span className="px-2 py-1 text-xs font-bold bg-accent-yellow text-black rounded">
                              TOP {entry.rank}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(entry.completedAt)}
                        </p>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="px-4 py-2 bg-accent-lime/20 border-2 border-accent-lime rounded-lg">
                          <p className="text-xs text-muted-foreground font-mono mb-1">
                            SCORE
                          </p>
                          <p className="text-2xl font-bold text-accent-lime">
                            {entry.points}%
                          </p>
                        </div>
                        <div className="px-4 py-2 bg-accent-cyan/20 border-2 border-accent-cyan rounded-lg">
                          <p className="text-xs text-muted-foreground font-mono mb-1">
                            TIME
                          </p>
                          <p className="text-sm font-bold text-accent-cyan">
                            {formatTime(entry.timeSpent)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
