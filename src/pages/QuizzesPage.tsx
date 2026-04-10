import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzes as mockQuizzes, Quiz } from '@/data/mockData';
import { quizzesAPI } from '@/lib/api';
import TabViolationScreen from '@/components/quiz/TabViolationScreen';
import PreQuizScreen from '@/components/quiz/PreQuizScreen';
import QuizActiveScreen from '@/components/quiz/QuizActiveScreen';
import QuizResultsScreen from '@/components/quiz/QuizResultsScreen';
import QuizReviewScreen from '@/components/quiz/QuizReviewScreen';
import QuizzesListScreen from '@/components/quiz/QuizzesListScreen';
import PageLoader from '@/components/PageLoader';

export default function QuizzesPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Screen state
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showPreQuizScreen, setShowPreQuizScreen] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  // Data state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // User attempt tracking
  const [hasAttempted, setHasAttempted] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [attemptTimeSpent, setAttemptTimeSpent] = useState(0);
  const [attemptCompletedAt, setAttemptCompletedAt] = useState('');
  const [checkingAttempt, setCheckingAttempt] = useState(false);

  // Security state
  const [tabViolation, setTabViolation] = useState(false);
  const [quizAborted, setQuizAborted] = useState(false);
  const [violationReason, setViolationReason] = useState<'tab-switch' | 'inspect' | 'copy'>('tab-switch');
  const [violationRecorded, setViolationRecorded] = useState(false);

  // Handle URL-based quiz selection
  useEffect(() => {
    if (dataLoaded && id) {
      const quiz = quizzes.find(q => q.id === id);
      if (quiz) {
        setSelectedQuiz(quiz);
        setShowPreQuizScreen(true);
      } else {
        setSelectedQuiz(null);
        setShowPreQuizScreen(false);
      }
    }
  }, [id, quizzes, dataLoaded]);

  // Fetch quizzes from API
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/quizzes`);
        if (response.ok) {
          const data = await response.json();
          const transformed = data.map((q: any) => ({
            id: q._id,
            title: q.title,
            topic: q.topic,
            questions: q.questions.map((qu: any) => ({
              id: qu.id || qu._id,
              question: qu.question,
              options: qu.options,
              correctAnswer: qu.correctAnswer,
              image: qu.image,
            })),
          }));
          if (transformed.length > 0) {
            setQuizzes(transformed);
          } else {
            setQuizzes(mockQuizzes);
          }
        }
      } catch (error) {
        setQuizzes(mockQuizzes);
      } finally {
        setLoading(false);
        setDataLoaded(true);
      }
    };

    fetchQuizzes();
  }, []);

  // Check if user has already attempted this quiz
  useEffect(() => {
    if (!selectedQuiz || !showPreQuizScreen) {
      setHasAttempted(false);
      setUserScore(0);
      setUserAnswers({});
      setAttemptTimeSpent(0);
      setAttemptCompletedAt('');
      setCheckingAttempt(false);
      return;
    }

    const checkUserAttempt = async () => {
      try {
        setCheckingAttempt(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setHasAttempted(false);
          setUserScore(0);
          setUserAnswers({});
          setAttemptTimeSpent(0);
          setAttemptCompletedAt('');
          return;
        }

        const response = await fetch(`${API_URL}/api/quizzes/${selectedQuiz.id}/attempt`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const attempt = await response.json();
          if (attempt && attempt.points !== undefined) {
            setHasAttempted(true);
            setUserScore(attempt.points);
            setUserAnswers(attempt.answers || {});
            setAttemptTimeSpent(attempt.timeSpent || 0);
            setAttemptCompletedAt(attempt.completedAt || '');
          } else {
            setHasAttempted(false);
            setUserScore(0);
            setUserAnswers({});
            setAttemptTimeSpent(0);
            setAttemptCompletedAt('');
          }
        } else if (response.status === 404) {
          // Not attempted yet
          setHasAttempted(false);
          setUserScore(0);
          setUserAnswers({});
          setAttemptTimeSpent(0);
          setAttemptCompletedAt('');
        } else {
          setHasAttempted(false);
        }
      } catch (error) {
        // Don't crash - just assume not attempted
        setHasAttempted(false);
        setUserScore(0);
        setUserAnswers({});
        setAttemptTimeSpent(0);
        setAttemptCompletedAt('');
      } finally {
        setCheckingAttempt(false);
      }
    };

    checkUserAttempt();
  }, [selectedQuiz, showPreQuizScreen]);

  // Track quiz start time
  useEffect(() => {
    if (quizActive && !showResults) {
      setQuizStartTime(Date.now());
    }
  }, [quizActive, showResults]);

  // Auto-submit quiz when showing results
  useEffect(() => {
    if (quizActive && showResults && selectedQuiz && !showLeaderboard && !submitting) {
      // Check if all questions are answered
      const allAnswered = selectedQuiz.questions.every(q => answers[q.id] !== undefined);
      if (allAnswered) {
        submitQuizResult();
      }
    }
  }, [quizActive, showResults, selectedQuiz, answers, showLeaderboard, submitting]);

  // SECURITY: Handle violations and record them
  const recordSecurityViolation = async (reason: 'tab-switch' | 'inspect' | 'copy') => {
    if (!selectedQuiz || violationRecorded) return;
    
    try {
      setViolationRecorded(true);
      console.log('Recording security violation:', reason);
      
      // Record violation with partial answers
      await quizzesAPI.recordViolation(selectedQuiz.id, reason, answers);
      
      console.log('Security violation recorded successfully');
    } catch (error: any) {
      console.error('Failed to record security violation:', error);
      // Even if recording fails, the user is disqualified
    }
  };

  // SECURITY: TAB DETECTION, COPY BLOCKING, INSPECT DETECTION
  useEffect(() => {
    if (!quizActive || showResults) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationReason('tab-switch');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        recordSecurityViolation('tab-switch');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C (copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I (inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        recordSecurityViolation('inspect');
        return false;
      }

      // Block Ctrl+Shift+C (inspect element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        recordSecurityViolation('inspect');
        return false;
      }

      // Block F12 (developer tools)
      if (e.key === 'F12') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        recordSecurityViolation('inspect');
        return false;
      }

      // Block Ctrl+Shift+J (console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        recordSecurityViolation('inspect');
        return false;
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        setViolationReason('tab-switch');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        recordSecurityViolation('tab-switch');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [quizActive, showResults, selectedQuiz, answers, violationRecorded]);

  // Handlers
  const startQuiz = async () => {
    if (hasAttempted) {
      alert('You have already attempted this quiz. Each quiz can only be attempted once.');
      return;
    }

    setShowPreQuizScreen(false);
    setQuizActive(true);
    setTabViolation(false);
    setQuizAborted(false);
  };

  const handleAnswer = (qId: string, optIndex: number) => {
    if (answers[qId] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const submitQuizResult = async () => {
    if (!selectedQuiz || !quizStartTime) return;

    try {
      setSubmitting(true);
      const correct = selectedQuiz.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
      const total = selectedQuiz.questions.length;
      const points = Math.round((correct / total) * 100);
      const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);

      console.log('Submitting quiz:', { quizId: selectedQuiz.id, score: points, timeSpent, answerCount: Object.keys(answers).length });

      await quizzesAPI.submitAnswer(selectedQuiz.id, points, timeSpent, answers);
      
      // Update local state immediately after successful submission
      setHasAttempted(true);
      setUserScore(points);
      setUserAnswers(answers);
      setAttemptTimeSpent(timeSpent);
      setAttemptCompletedAt(new Date().toISOString());
      
      setShowLeaderboard(true);
    } catch (error: any) {
      console.error('Failed to submit quiz result:', error?.response?.data?.error || error.message);
      // If already attempted error, refresh the attempt data and show review
      if (error?.response?.status === 400 && error?.response?.data?.error?.includes('already attempted')) {
        alert('You have already attempted this quiz once. Please review your previous attempt.');
        // Refresh the attempt data
        const token = localStorage.getItem('authToken');
        if (token && selectedQuiz) {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/quizzes/${selectedQuiz.id}/attempt`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const attempt = await response.json();
            setHasAttempted(true);
            setUserScore(attempt.points);
            setUserAnswers(attempt.answers || {});
            setAttemptTimeSpent(attempt.timeSpent || 0);
            setAttemptCompletedAt(attempt.completedAt || '');
            setQuizActive(false);
            setShowResults(false);
            // Auto-show review screen
            return;
          }
        }
      } else {
        alert('Failed to submit quiz. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
    setShowLeaderboard(false);
    setQuizStartTime(null);
    setQuizActive(false);
    setShowPreQuizScreen(false);
    setTabViolation(false);
    setQuizAborted(false);
    setViolationReason('tab-switch');
    setViolationRecorded(false);
    setHasAttempted(false);
    setUserScore(0);
    setUserAnswers({});
    setAttemptTimeSpent(0);
    setAttemptCompletedAt('');
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
    setShowLeaderboard(false);
    setQuizStartTime(null);
    setQuizActive(false);
    setTabViolation(false);
    setQuizAborted(false);
    setViolationReason('tab-switch');
    setViolationRecorded(false);
    setHasAttempted(false);
    setUserScore(0);
    setUserAnswers({});
    setAttemptTimeSpent(0);
    setAttemptCompletedAt('');
    navigate(`/quizzes/${quiz.id}`);
  };

  const handleBackToQuizzes = () => {
    navigate('/quizzes');
    resetQuiz();
  };

  // RENDER LOGIC
  if (tabViolation && quizAborted && selectedQuiz) {
    return (
      <TabViolationScreen
        onBack={handleBackToQuizzes}
        reason={violationReason}
      />
    );
  }

  // Show review screen if user has already attempted this quiz
  if (selectedQuiz && showPreQuizScreen && !quizActive && hasAttempted && !checkingAttempt) {
    return (
      <QuizReviewScreen
        quiz={selectedQuiz}
        userAnswers={userAnswers}
        score={userScore}
        timeSpent={attemptTimeSpent}
        completedAt={attemptCompletedAt}
        onBack={handleBackToQuizzes}
      />
    );
  }

  // Show loader while verifying attempt status
  if (selectedQuiz && showPreQuizScreen && checkingAttempt) {
    return <PageLoader isLoading={true} message="Verifying your attempt status..." />;
  }

  if (selectedQuiz && showPreQuizScreen && !quizActive && !checkingAttempt) {
    return (
      <PreQuizScreen
        quiz={selectedQuiz}
        onStart={startQuiz}
        onBack={handleBackToQuizzes}
        hasAttempted={hasAttempted}
        userScore={userScore}
      />
    );
  }

  if (quizActive && selectedQuiz && showResults) {
    return (
      <QuizResultsScreen
        quiz={selectedQuiz}
        answers={answers}
        showLeaderboard={showLeaderboard}
        submitting={submitting}
        onSubmitResults={submitQuizResult}
        onRetry={() => {
          resetQuiz();
          setQuizActive(true);
        }}
        onBack={handleBackToQuizzes}
      />
    );
  }

  if (quizActive && selectedQuiz && !showResults) {
    return (
      <QuizActiveScreen
        quiz={selectedQuiz}
        currentQuestion={currentQ}
        answers={answers}
        onAnswer={handleAnswer}
        onNext={() => setCurrentQ((p) => p + 1)}
        onViewResults={() => setShowResults(true)}
        onBack={handleBackToQuizzes}
      />
    );
  }

  return (
    <>
      {/* GitHub Promotion Banner */}
      <div className="bg-gradient-to-r from-accent-indigo/20 to-accent-purple/20 border-b-2 border-accent-purple px-6 pt-2 pb-6 mb-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-black">
              ★
            </div>
            <div>
              <p className="font-bold text-sm">Love System Design Learning?</p>
              <p className="text-xs text-muted-foreground">Star us on GitHub for more resources</p>
            </div>
          </div>
          <a
            href="https://github.com/CodingEnthusiastic/System-Point"
            target="_blank"
            rel="noopener noreferrer"
            className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Star on GitHub
          </a>
        </div>
      </div>

      <QuizzesListScreen
        quizzes={quizzes}
        onSelectQuiz={handleSelectQuiz}
      />
      <PageLoader isLoading={loading} message="Loading quizzes..." />
    </>
  );
}
