import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzes as mockQuizzes, Quiz } from '@/data/mockData';
import { quizzesAPI } from '@/lib/api';
import TabViolationScreen from '@/components/quiz/TabViolationScreen';
import PreQuizScreen from '@/components/quiz/PreQuizScreen';
import QuizActiveScreen from '@/components/quiz/QuizActiveScreen';
import QuizResultsScreen from '@/components/quiz/QuizResultsScreen';
import QuizzesListScreen from '@/components/quiz/QuizzesListScreen';

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

  // Security state
  const [tabViolation, setTabViolation] = useState(false);
  const [quizAborted, setQuizAborted] = useState(false);

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
        console.log('Using mock data (API not available)');
        setQuizzes(mockQuizzes);
      } finally {
        setLoading(false);
        setDataLoaded(true);
      }
    };

    fetchQuizzes();
  }, []);

  // Track quiz start time
  useEffect(() => {
    if (quizActive && !showResults) {
      setQuizStartTime(Date.now());
    }
  }, [quizActive, showResults]);

  // IMMEDIATE TAB DETECTION - NO WARNINGS
  useEffect(() => {
    if (!quizActive || showResults) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!document.hidden) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleFocusOut = () => {
      if (!document.hidden) {
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleFocusOut);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleFocusOut);
    };
  }, [quizActive, showResults]);

  // Handlers
  const startQuiz = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
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

      await quizzesAPI.submitAnswer(selectedQuiz.id, points, timeSpent);
      setShowLeaderboard(true);
    } catch (error) {
      console.log('Failed to submit quiz result:', error);
      setShowLeaderboard(true);
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
      />
    );
  }

  if (selectedQuiz && showPreQuizScreen && !quizActive) {
    return (
      <PreQuizScreen
        quiz={selectedQuiz}
        onStart={startQuiz}
        onBack={handleBackToQuizzes}
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
    <QuizzesListScreen
      quizzes={quizzes}
      onSelectQuiz={handleSelectQuiz}
    />
  );
}
