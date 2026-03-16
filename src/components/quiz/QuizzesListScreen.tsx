import { Brain, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Quiz } from '@/data/mockData';
import { useState } from 'react';

interface QuizzesListScreenProps {
  quizzes: Quiz[];
  onSelectQuiz: (quiz: Quiz) => void;
}

export default function QuizzesListScreen({ quizzes, onSelectQuiz }: QuizzesListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> QUIZZES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">TEST YOUR SYSTEM DESIGN KNOWLEDGE</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="neu-input w-full px-4 py-3 text-foreground border-2 border-foreground flex items-center gap-2" style={{ boxShadow: '2px 2px 0px #000' }}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quizzes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-sm"
          />
        </div>

        {/* Topic Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              selectedTopic === null 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            All Topics
          </button>
          {Array.from(new Set(quizzes.map(q => q.topic))).map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
                selectedTopic === topic 
                  ? 'bg-accent-indigo text-white border-accent-indigo' 
                  : 'bg-secondary text-foreground border-foreground hover:bg-accent-indigo/20'
              }`}
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground font-mono">
          Showing {quizzes.filter(q => 
            (searchQuery === '' || q.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (selectedTopic === null || q.topic === selectedTopic)
          ).length} quizzes
        </p>
      </div>

      {/* Quizzes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes
          .filter(q => 
            (searchQuery === '' || q.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (selectedTopic === null || q.topic === selectedTopic)
          )
          .map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <button
              onClick={() => onSelectQuiz(quiz)}
              className="w-full text-left group cursor-pointer h-full"
            >
              <div className="neu-card-blue p-6 h-full flex flex-col">
                <div className="w-12 h-12 bg-accent-indigo border-3 border-foreground flex items-center justify-center mb-4 shrink-0" style={{ boxShadow: '3px 3px 0px #000' }}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">{quiz.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground font-mono mt-auto">
                  <span>{quiz.questions.length} questions</span>
                  <span className="neu-badge px-3 py-1 bg-secondary text-foreground">{quiz.topic}</span>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
