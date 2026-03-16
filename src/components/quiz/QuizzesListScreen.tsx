import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { Quiz } from '@/data/mockData';

interface QuizzesListScreenProps {
  quizzes: Quiz[];
  onSelectQuiz: (quiz: Quiz) => void;
}

export default function QuizzesListScreen({ quizzes, onSelectQuiz }: QuizzesListScreenProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> QUIZZES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">TEST YOUR SYSTEM DESIGN KNOWLEDGE</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <button
              onClick={() => onSelectQuiz(quiz)}
              className="w-full text-left group cursor-pointer"
            >
              <div className="neu-card-blue p-6 h-full">
                <div className="w-12 h-12 bg-accent-indigo border-3 border-foreground flex items-center justify-center mb-4" style={{ boxShadow: '3px 3px 0px #000' }}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{quiz.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
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
