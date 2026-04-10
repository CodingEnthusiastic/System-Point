import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz, QuizQuestion } from '@/data/mockData';
import { Plus, Trash2, Edit3, Save, X, Upload, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { quizzesAPI } from '@/lib/api';

export default function ManageQuizzesPage() {
  const { isAdmin } = useAuth();
  const [quizzesList, setQuizzesList] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Quiz editor state
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    topic: '',
    questions: [] as QuizQuestion[],
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);

  if (!isAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      const quizzesRes = await quizzesAPI.getAll();
      const transformedQuizzes = quizzesRes.data.map((q: any) => ({
        id: q._id,
        title: q.title,
        topic: q.topic,
        questions: q.questions || [],
      }));
      setQuizzesList(transformedQuizzes);
    } catch (error) {
      setQuizzesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openQuizEditor = (quiz?: Quiz) => {
    if (quiz) {
      setEditingQuiz(quiz);
      setQuizForm({
        title: quiz.title,
        topic: quiz.topic,
        questions: quiz.questions || [],
      });
    } else {
      setEditingQuiz({ id: '', title: '', topic: '', questions: [] });
      setQuizForm({ title: '', topic: '', questions: [] });
    }
    setEditingQuestionIndex(null);
    setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: String(Date.now()),
      question: questionForm.question,
      options: questionForm.options.filter((o) => o.trim() !== ''),
      correctAnswer: questionForm.correctAnswer,
    };

    if (editingQuestionIndex !== null) {
      const updated = [...quizForm.questions];
      updated[editingQuestionIndex] = newQuestion;
      setQuizForm((p) => ({ ...p, questions: updated }));
      setEditingQuestionIndex(null);
    } else {
      setQuizForm((p) => ({
        ...p,
        questions: [...p.questions, newQuestion],
      }));
    }
    setQuestionForm({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
  };

  const removeQuestion = (index: number) => {
    setQuizForm((p) => ({
      ...p,
      questions: p.questions.filter((_, i) => i !== index),
    }));
  };

  const editQuestion = (index: number) => {
    const q = quizForm.questions[index];
    setQuestionForm({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    });
    setEditingQuestionIndex(index);
  };

  const importQuizzesFromJson = async () => {
    try {
      let data = JSON.parse(jsonInput);
      
      // Handle nested structure: { "quiz": { ... } }
      if (data.quiz && !Array.isArray(data)) {
        data = data.quiz;
      }
      
      // Convert to array if single object
      const quizzesToImport = Array.isArray(data) ? data : [data];

      // Validate each quiz before importing
      for (const q of quizzesToImport) {
        if (!q.title?.trim()) {
          alert('❌ Each quiz must have a title');
          return;
        }
        
        // Topic is optional but if provided must not be empty
        const topic = q.topic?.trim() || 'General';
        
        if (!q.questions || q.questions.length === 0) {
          alert('❌ Each quiz must have at least one question');
          return;
        }
        
        // Validate questions
        for (const question of q.questions) {
          if (!question.question?.trim()) {
            alert('❌ All questions must have text');
            return;
          }
          if (!question.options || question.options.length < 2) {
            alert('❌ Each question must have at least 2 options');
            return;
          }
          if (question.correctAnswer === undefined || question.correctAnswer === null) {
            alert('❌ All questions must have a correct answer index');
            return;
          }
        }
      }

      // Direct save to database for each quiz
      setIsLoading(true);
      let successCount = 0;

      for (const q of quizzesToImport) {
        const quizData = {
          title: q.title?.trim(),
          topic: q.topic?.trim() || 'General',
          questions: q.questions.map((question: any) => ({
            question: question.question?.trim(),
            options: Array.isArray(question.options) 
              ? question.options.map((opt: string) => opt?.trim() || '')
              : question.options,
            correctAnswer: typeof question.correctAnswer === 'number' 
              ? question.correctAnswer 
              : 0,
          })),
        };

        try {
          await quizzesAPI.create(quizData);
          successCount++;
        } catch (error: any) {
          console.error('Error saving quiz:', error);
          alert(`❌ Failed to save "${q.title}": ${error?.response?.data?.message || error.message}`);
          return;
        }
      }

      // Reload quizzes list
      await loadQuizzes();
      
      setJsonInput('');
      setShowJsonImport(false);
      alert(`✅ Successfully imported ${successCount} quiz${successCount !== 1 ? 'zes' : ''}!`);
      
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        alert('❌ Invalid JSON format. Please check your syntax and try again.');
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!quizForm.title?.trim()) {
      alert('❌ Please enter a quiz title');
      return;
    }

    if (!quizForm.topic?.trim()) {
      alert('❌ Please enter a quiz topic');
      return;
    }

    if (quizForm.questions.length === 0) {
      alert('❌ Add at least one question to the quiz');
      return;
    }

    // Validate all questions have valid options
    const invalidQuestions = quizForm.questions.filter(
      (q) => q.options.length < 2 || !q.question.trim()
    );
    if (invalidQuestions.length > 0) {
      alert('❌ Each question must have at least 2 options');
      return;
    }

    const quiz: Quiz = {
      ...editingQuiz,
      id: editingQuiz?.id || String(Date.now()),
      title: quizForm.title,
      topic: quizForm.topic,
      questions: quizForm.questions,
    };

    try {
      setIsLoading(true);
      if (editingQuiz?.id) {
        await quizzesAPI.update(quiz.id, {
          title: quiz.title,
          topic: quiz.topic,
          questions: quiz.questions,
        });
        setQuizzesList((p) =>
          p.map((q) => (q.id === quiz.id ? quiz : q))
        );
        alert('✅ Quiz updated successfully!');
      } else {
        const response = await quizzesAPI.create({
          title: quiz.title,
          topic: quiz.topic,
          questions: quiz.questions,
        });
        setQuizzesList((p) => [...p, { ...quiz, id: response.data._id }]);
        alert('✅ Quiz created successfully!');
      }
      setEditingQuiz(null);
      setQuizForm({ title: '', topic: '', questions: [] });
      setEditingQuestionIndex(null);
    } catch (error: any) {
      console.error('Quiz save error:', error);
      alert(
        error?.response?.data?.message ||
        '❌ Failed to save quiz. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!window.confirm('Delete this quiz?')) return;
    try {
      await quizzesAPI.delete(id);
      setQuizzesList((p) => p.filter((q) => q.id !== id));
    } catch (error) {
      alert('Failed to delete quiz');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> MANAGE QUIZZES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">CREATE AND MANAGE YOUR QUIZZES</p>
      </div>

      {/* Direct JSON Import Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-card-purple p-6 border-2 border-accent-purple"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-wider mb-1">
              <Upload className="w-5 h-5 inline mr-2" />
              Import Quizzes from JSON
            </h3>
            <p className="text-xs text-muted-foreground font-mono">
              Paste quiz JSON and it will be saved directly to the database
            </p>
          </div>
          <button
            onClick={() => setShowJsonImport(!showJsonImport)}
            className="neu-btn px-3 py-2 text-sm cursor-pointer bg-accent-purple/20"
          >
            {showJsonImport ? 'Hide' : 'Show'} Import
          </button>
        </div>

        {showJsonImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 border-t-2 border-accent-purple pt-4"
          >
            <div className="p-3 bg-secondary/50 rounded text-xs font-mono space-y-2">
              <p className="font-bold text-primary">Supported JSON Formats:</p>
              <details className="cursor-pointer">
                <summary className="font-bold text-accent-purple hover:underline">
                  Format 1: Nested (Recommended)
                </summary>
                <pre className="overflow-x-auto text-xs bg-black/20 p-2 rounded mt-2">
{`{
  "quiz": {
    "title": "System Design Basics",
    "topic": "Architecture",
    "questions": [
      {
        "question": "What is X?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0
      }
    ]
  }
}`}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="font-bold text-accent-purple hover:underline">
                  Format 2: Direct Object
                </summary>
                <pre className="overflow-x-auto text-xs bg-black/20 p-2 rounded mt-2">
{`{
  "title": "System Design Basics",
  "topic": "Architecture",
  "questions": [...]
}`}
                </pre>
              </details>
              <details className="cursor-pointer">
                <summary className="font-bold text-accent-purple hover:underline">
                  Format 3: Array
                </summary>
                <pre className="overflow-x-auto text-xs bg-black/20 p-2 rounded mt-2">
{`[
  {
    "title": "Quiz 1",
    "topic": "Topic 1",
    "questions": [...]
  }
]`}
                </pre>
              </details>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Paste your quiz JSON here...'
              className="neu-input w-full px-4 py-3 text-sm text-foreground font-mono h-32"
            />

            <div className="flex gap-2">
              <button
                onClick={importQuizzesFromJson}
                disabled={!jsonInput.trim() || isLoading}
                className="neu-btn-blue px-6 py-2 text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {isLoading ? 'Importing...' : 'Import & Save to Database'}
              </button>
              <button
                onClick={() => {
                  setShowJsonImport(false);
                  setJsonInput('');
                }}
                className="neu-btn px-6 py-2 text-sm bg-secondary cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Quiz Editor Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card-blue p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {editingQuiz.id ? 'Edit Quiz' : 'New Quiz'}
              </h3>
              <button
                onClick={() => {
                  setEditingQuiz(null);
                  setQuizForm({ title: '', topic: '', questions: [] });
                }}
                className="p-2 hover:bg-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz Basic Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Title
                </label>
                <input
                  value={quizForm.title}
                  onChange={(e) =>
                    setQuizForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Topic
                </label>
                <input
                  value={quizForm.topic}
                  onChange={(e) =>
                    setQuizForm((p) => ({ ...p, topic: e.target.value }))
                  }
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
            </div>

            {/* Questions Section */}
            <div className="border-t border-primary/20 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold uppercase tracking-wider">
                  Questions ({quizForm.questions.length})
                </h4>
              </div>

              {/* Question Editor */}
              <div className="neu-card p-4 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      Question Text
                    </label>
                    <textarea
                      value={questionForm.question}
                      onChange={(e) =>
                        setQuestionForm((p) => ({
                          ...p,
                          question: e.target.value,
                        }))
                      }
                      className="neu-input w-full px-4 py-3 text-foreground min-h-20"
                      placeholder="Enter question text"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {questionForm.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <input
                            value={option}
                            onChange={(e) => {
                              const updated = [...questionForm.options];
                              updated[idx] = e.target.value;
                              setQuestionForm((p) => ({
                                ...p,
                                options: updated,
                              }));
                            }}
                            className="neu-input flex-1 px-4 py-2 text-foreground"
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          />
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={questionForm.correctAnswer === idx}
                            onChange={() =>
                              setQuestionForm((p) => ({
                                ...p,
                                correctAnswer: idx,
                              }))
                            }
                            className="cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={addQuestion}
                      disabled={
                        !questionForm.question ||
                        questionForm.options.filter((o) => o.trim()).length < 2
                      }
                      className="neu-btn-blue px-4 py-2 text-sm disabled:opacity-50 cursor-pointer"
                    >
                      {editingQuestionIndex !== null
                        ? 'Update Question'
                        : 'Add Question'}
                    </button>
                    {editingQuestionIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingQuestionIndex(null);
                          setQuestionForm({
                            question: '',
                            options: ['', '', '', ''],
                            correctAnswer: 0,
                          });
                        }}
                        className="neu-btn px-4 py-2 text-sm cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Questions List */}
              {quizForm.questions.length > 0 && (
                <div className="space-y-2 mb-6">
                  {quizForm.questions.map((q, idx) => (
                    <div key={q.id} className="neu-card p-3 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold">Q{idx + 1}: {q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Options: {q.options.length} | Correct:{' '}
                          {String.fromCharCode(65 + q.correctAnswer)}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => editQuestion(idx)}
                          className="p-2 hover:bg-secondary cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="p-2 hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6 border-t border-primary/20">
              <button
                onClick={saveQuiz}
                className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Quiz
              </button>
              <button
                onClick={() => {
                  setEditingQuiz(null);
                  setQuizForm({ title: '', topic: '', questions: [] });
                }}
                className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quizzes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {quizzesList.length} Quizzes
          </h3>
          <button
            onClick={() => openQuizEditor()}
            className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Quiz
          </button>
        </div>
        {quizzesList.map((quiz) => (
          <div key={quiz.id} className="neu-card p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 bg-accent-indigo border-2 border-foreground flex items-center justify-center shrink-0"
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate">{quiz.title}</h4>
              <p className="text-sm text-muted-foreground font-mono">
                {quiz.questions.length} questions · {quiz.topic}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openQuizEditor(quiz)}
                className="p-2 border-2 border-foreground bg-secondary hover:bg-primary/20 cursor-pointer"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteQuiz(quiz.id)}
                className="p-2 border-2 border-foreground bg-destructive/20 hover:bg-destructive/40 cursor-pointer"
                style={{ boxShadow: '2px 2px 0px #000' }}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
