import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Quiz } from '@/data/mockData';
import { getImageUrl } from '@/lib/utils';

interface QuizActiveScreenProps {
  quiz: Quiz;
  currentQuestion: number;
  answers: Record<string, number>;
  onAnswer: (questionId: string, optionIndex: number) => void;
  onNext: () => void;
  onViewResults: () => void;
  onBack: () => void;
}

export default function QuizActiveScreen({
  quiz,
  currentQuestion,
  answers,
  onAnswer,
  onNext,
  onViewResults,
  onBack,
}: QuizActiveScreenProps) {
  const question = quiz.questions[currentQuestion];
  const answered = answers[question.id] !== undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </button>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground">
        <span>Question {currentQuestion + 1}/{quiz.questions.length}</span>
        <span>{quiz.title}</span>
      </div>
      <div className="w-full h-3 bg-secondary border-2 border-foreground" style={{ boxShadow: '2px 2px 0px #000' }}>
        <div className="h-full bg-primary transition-all" style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <div className="neu-card-blue p-8 space-y-6">
        <h2 className="text-xl font-bold">{question.question}</h2>

        {question.image && (
          <div className="aspect-video overflow-hidden border-3 border-foreground" style={{ boxShadow: '3px 3px 0px #000' }}>
            <img src={getImageUrl(question.image)} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-3">
          {question.options.map((opt, i) => {
            let style = 'bg-secondary text-foreground border-foreground hover:bg-primary/20';
            if (answered) {
              if (i === question.correctAnswer) style = 'bg-accent-lime/20 text-accent-lime border-accent-lime';
              else if (i === answers[question.id]) style = 'bg-destructive/20 text-destructive border-destructive';
              else style = 'bg-secondary/50 text-muted-foreground border-border';
            }

            return (
              <button
                key={i}
                onClick={() => onAnswer(question.id, i)}
                disabled={answered}
                className={`w-full text-left p-4 border-3 font-bold flex items-center gap-3 transition-all ${style} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <span className="w-8 h-8 border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt}</span>
                {answered && i === question.correctAnswer && <CheckCircle className="w-5 h-5 ml-auto shrink-0" />}
                {answered && i === answers[question.id] && i !== question.correctAnswer && <XCircle className="w-5 h-5 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="flex justify-end">
            {currentQuestion < quiz.questions.length - 1 ? (
              <button onClick={onNext} className="neu-btn-blue px-6 py-3 cursor-pointer">
                Next Question →
              </button>
            ) : (
              <button onClick={onViewResults} className="neu-btn-blue px-6 py-3 cursor-pointer">
                View Results →
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
