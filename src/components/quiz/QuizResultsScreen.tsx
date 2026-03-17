import { ArrowLeft, Trophy, Loader, RotateCcw, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QuizLeaderboard from '@/components/QuizLeaderboard';
import { Quiz } from '@/data/mockData';

interface QuizResultsScreenProps {
  quiz: Quiz;
  answers: Record<string, number>;
  showLeaderboard: boolean;
  submitting: boolean;
  onSubmitResults: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export default function QuizResultsScreen({
  quiz,
  answers,
  showLeaderboard,
  submitting,
  onSubmitResults,
  onRetry,
  onBack,
}: QuizResultsScreenProps) {
  const navigate = useNavigate();
  const correct = quiz.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
  const total = quiz.questions.length;
  const pct = Math.round((correct / total) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex gap-2">
        <button
          onClick={onBack}
          className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>
        <button
          onClick={() => navigate(`/leaderboard/${quiz.id}`)}
          className="neu-btn px-4 py-2 bg-accent-yellow text-black inline-flex items-center gap-2 text-sm cursor-pointer font-bold"
          style={{ boxShadow: '2px 2px 0px #B8860B' }}
        >
          <Trophy className="w-4 h-4" /> Full Leaderboard <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {showLeaderboard ? (
        <>
          <div className="neu-card-blue p-8 text-center space-y-4 mb-6">
            <Trophy className="w-16 h-16 mx-auto text-accent-yellow" />
            <h2 className="text-3xl font-bold">Quiz Complete!</h2>
            <div className="text-6xl font-bold text-primary">{pct}%</div>
            <p className="text-xl font-mono">{correct}/{total} correct answers</p>
            <div className="w-full h-6 bg-secondary border-3 border-foreground" style={{ boxShadow: '3px 3px 0px #000' }}>
              <div
                className={`h-full transition-all ${pct >= 70 ? 'bg-accent-lime' : pct >= 40 ? 'bg-accent-yellow' : 'bg-destructive'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm text-accent-lime font-bold">✓ Your score has been recorded on the leaderboard!</p>
          </div>

          <QuizLeaderboard quizId={quiz.id} quizTitle={quiz.title} />

          <div className="space-y-4">
            <h3 className="text-xl font-bold uppercase tracking-wider">Review Your Answers</h3>
            {quiz.questions.map((q, i) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <div key={q.id} className={`neu-card p-5 ${isCorrect ? 'border-accent-lime' : 'border-destructive'}`} style={{ borderWidth: '3px' }}>
                  <p className="font-bold mb-2">Q{i + 1}. {q.question}</p>
                  <p className="text-sm">
                    Your answer: <span className={isCorrect ? 'text-accent-lime' : 'text-destructive'}>{q.options[answers[q.id]]}</span>
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-accent-lime">Correct: {q.options[q.correctAnswer]}</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center mb-6">
            <button onClick={onBack} className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer">
              All Quizzes
            </button>
          </div>
        </>
      ) : (
        <div className="neu-card-blue p-8 text-center space-y-6">
          <Trophy className="w-16 h-16 mx-auto text-accent-yellow" />
          <h2 className="text-3xl font-bold">Quiz Complete!</h2>
          <div className="text-6xl font-bold text-primary">{pct}%</div>
          <p className="text-xl font-mono">{correct}/{total} correct answers</p>
          <div className="w-full h-6 bg-secondary border-3 border-foreground" style={{ boxShadow: '3px 3px 0px #000' }}>
            <div
              className={`h-full transition-all ${pct >= 70 ? 'bg-accent-lime' : pct >= 40 ? 'bg-accent-yellow' : 'bg-destructive'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            onClick={onSubmitResults}
            disabled={submitting}
            className={`neu-btn-blue px-8 py-3 inline-flex items-center gap-2 ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" /> View Leaderboard
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
