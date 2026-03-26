import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Course, Lesson } from '@/data/mockData';
import { Plus, Trash2, Edit3, Save, X, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { coursesAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

export default function ManageCoursesPage() {
  const { isAdmin } = useAuth();
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Course editor state
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    thumbnail: '',
    lessons: [] as any[],
  });
  const [editingLesson, setEditingLesson] = useState<{
    title: string;
    youtubeId: string;
    duration: string;
    description: string;
  } | null>(null);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);

  if (!isAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const coursesRes = await coursesAPI.getAll();
      const transformedCourses = coursesRes.data.map((c: any) => ({
        id: c._id,
        title: c.title,
        description: c.description,
        category: c.category,
        difficulty: c.difficulty,
        thumbnail: c.thumbnail,
        lessons: c.lessons || [],
        totalDuration: c.totalDuration || '',
      }));
      setCoursesList(transformedCourses);
    } catch (error) {
      setCoursesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openCourseEditor = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title,
        description: course.description,
        category: course.category,
        difficulty: course.difficulty,
        thumbnail: course.thumbnail,
        lessons: course.lessons,
      });
    } else {
      setEditingCourse({
        id: '',
        title: '',
        description: '',
        category: 'HLD',
        difficulty: 'Beginner',
        thumbnail: '',
        lessons: [],
        totalDuration: '',
      });
      setCourseForm({
        title: '',
        description: '',
        category: 'HLD',
        difficulty: 'Beginner',
        thumbnail: '',
        lessons: [],
      });
    }
    setEditingLesson(null);
    setEditingLessonIndex(null);
  };

  const normalizeGoogleDriveUrl = (url: string): string => {
    let fileId = '';
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match1) {
      fileId = match1[1];
    }
    const match2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (match2 && !fileId) {
      fileId = match2[1];
    }
    if (url.includes('uc?export=view')) {
      return url;
    }
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    return url;
  };

  const addOrUpdateLesson = () => {
    if (
      !editingLesson ||
      !editingLesson.title ||
      !editingLesson.youtubeId ||
      !editingLesson.duration
    ) {
      alert('Title, YouTube URL, and duration are required');
      return;
    }

    if (editingLessonIndex !== null) {
      setCourseForm((p) => ({
        ...p,
        lessons: p.lessons.map((l, idx) =>
          idx === editingLessonIndex ? { ...l, ...editingLesson } : l
        ),
      }));
    } else {
      setCourseForm((p) => ({
        ...p,
        lessons: [
          ...p.lessons,
          { id: String(Date.now()), ...editingLesson },
        ],
      }));
    }
    setEditingLesson(null);
    setEditingLessonIndex(null);
  };

  const importLessonsFromJson = () => {
    try {
      const lessons = JSON.parse(jsonInput);
      if (Array.isArray(lessons)) {
        setCourseForm((p) => ({
          ...p,
          lessons: [
            ...p.lessons,
            ...lessons.map((l: any) => ({
              id: String(Date.now()) + Math.random(),
              title: l.title,
              youtubeId: l.youtubeId,
              duration: l.duration,
              description: l.description || '',
            })),
          ],
        }));
        alert('✅ Lessons imported successfully!');
        setJsonInput('');
      } else {
        alert('❌ Please provide an array of lessons');
      }
    } catch (error) {
      alert('❌ Invalid JSON format');
    }
  };

  const removeLesson = (index: number) => {
    setCourseForm((p) => ({
      ...p,
      lessons: p.lessons.filter((_, i) => i !== index),
    }));
  };

  const saveCourse = async () => {
    if (!editingCourse || !courseForm.title) {
      alert('Title is required');
      return;
    }

    const normalizedThumbnail = courseForm.thumbnail.includes('drive.google.com')
      ? normalizeGoogleDriveUrl(courseForm.thumbnail)
      : courseForm.thumbnail;

    const course: Course = {
      ...editingCourse,
      id: editingCourse.id || String(Date.now()),
      title: courseForm.title,
      description: courseForm.description,
      category: courseForm.category as 'HLD' | 'LLD' | 'Fundamentals',
      difficulty: courseForm.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
      thumbnail: normalizedThumbnail,
      lessons: courseForm.lessons,
      totalDuration: `${courseForm.lessons.length}h`,
    };

    try {
      if (editingCourse.id) {
        await coursesAPI.update(course.id, {
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty,
          thumbnail: course.thumbnail,
          lessons: course.lessons,
          totalDuration: course.totalDuration,
        });
        setCoursesList((p) =>
          p.map((c) => (c.id === course.id ? course : c))
        );
      } else {
        const response = await coursesAPI.create({
          title: course.title,
          description: course.description,
          category: course.category,
          difficulty: course.difficulty,
          thumbnail: course.thumbnail,
          lessons: course.lessons,
          totalDuration: course.totalDuration,
        });
        setCoursesList((p) => [...p, { ...course, id: response.data._id }]);
      }
      setEditingCourse(null);
    } catch (error) {
      alert('Failed to save course');
    }
  };

  const deleteCourse = async (id: string) => {
    if (!window.confirm('Delete this course?')) return;
    try {
      await coursesAPI.delete(id);
      setCoursesList((p) => p.filter((c) => c.id !== id));
    } catch (error) {
      alert('Failed to delete course');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> MANAGE COURSES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">CREATE AND MANAGE YOUR COURSES</p>
      </div>

      {/* Course Editor Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card-blue p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {editingCourse.id ? 'Edit Course' : 'New Course'}
              </h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-2 hover:bg-secondary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Title
                </label>
                <input
                  value={courseForm.title}
                  onChange={(e) =>
                    setCourseForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Description
                </label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) =>
                    setCourseForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="neu-input w-full px-4 py-3 text-foreground h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    Category
                  </label>
                  <select
                    value={courseForm.category}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="neu-input w-full px-4 py-3 text-foreground"
                  >
                    <option value="HLD">HLD</option>
                    <option value="LLD">LLD</option>
                    <option value="Fundamentals">Fundamentals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    Difficulty
                  </label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, difficulty: e.target.value }))
                    }
                    className="neu-input w-full px-4 py-3 text-foreground"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Thumbnail URL
                </label>
                <input
                  value={courseForm.thumbnail}
                  onChange={(e) =>
                    setCourseForm((p) => ({ ...p, thumbnail: e.target.value }))
                  }
                  placeholder="Paste Google Drive image URL..."
                  className="neu-input w-full px-4 py-3 text-foreground font-mono text-sm"
                />
              </div>

              {/* Lessons Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold uppercase tracking-wider">
                    Lessons ({courseForm.lessons.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingLesson({
                          title: '',
                          youtubeId: '',
                          duration: '',
                          description: '',
                        });
                        setEditingLessonIndex(null);
                      }}
                      className="neu-btn px-2 py-1 text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Lesson
                    </button>
                    <button
                      onClick={() => setShowJsonImport(!showJsonImport)}
                      className="neu-btn px-2 py-1 text-xs inline-flex items-center gap-1 cursor-pointer bg-accent-cyan/20"
                    >
                      <Upload className="w-3 h-3" /> Import JSON
                    </button>
                  </div>
                </div>

                {/* JSON Import Input */}
                {showJsonImport && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4 p-3 bg-accent-cyan/10 border-2 border-accent-cyan rounded space-y-2"
                  >
                    <label className="block text-xs font-bold uppercase">
                      Paste Lessons JSON Array
                    </label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      placeholder='[{"title":"Lesson 1","youtubeId":"dQw4w9WgXcQ","duration":"15:30","description":"Description"}]'
                      className="neu-input w-full px-3 py-2 text-xs text-foreground font-mono h-24"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={importLessonsFromJson}
                        className="neu-btn-blue px-3 py-1 text-xs cursor-pointer"
                      >
                        Import
                      </button>
                      <button
                        onClick={() => {
                          setShowJsonImport(false);
                          setJsonInput('');
                        }}
                        className="neu-btn px-3 py-1 text-xs bg-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Lessons List */}
                {courseForm.lessons.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {courseForm.lessons.map((lesson, idx) => (
                      <div
                        key={lesson.id || idx}
                        className="p-3 bg-secondary border-2 border-border flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.duration} • {lesson.youtubeId}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0 ml-2">
                          <button
                            onClick={() => {
                              setEditingLesson(lesson);
                              setEditingLessonIndex(idx);
                            }}
                            className="p-1 hover:bg-primary/20 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeLesson(idx)}
                            className="p-1 hover:bg-red-600/20 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lesson Form */}
                {editingLesson !== null && (
                  <div className="p-4 bg-secondary border-2 border-accent-indigo space-y-3">
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">
                        Lesson Title
                      </label>
                      <input
                        type="text"
                        value={editingLesson.title}
                        onChange={(e) =>
                          setEditingLesson((p) => ({ ...p!, title: e.target.value }))
                        }
                        className="neu-input w-full px-3 py-2 text-sm text-foreground"
                        placeholder="e.g., What is System Design?"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">
                        YouTube Video ID
                      </label>
                      <input
                        type="text"
                        value={editingLesson.youtubeId}
                        onChange={(e) =>
                          setEditingLesson((p) => ({
                            ...p!,
                            youtubeId: e.target.value,
                          }))
                        }
                        className="neu-input w-full px-3 py-2 text-sm text-foreground font-mono"
                        placeholder="e.g., dQw4w9WgXcQ"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">Duration</label>
                      <input
                        type="text"
                        value={editingLesson.duration}
                        onChange={(e) =>
                          setEditingLesson((p) => ({
                            ...p!,
                            duration: e.target.value,
                          }))
                        }
                        className="neu-input w-full px-3 py-2 text-sm text-foreground"
                        placeholder="e.g., 15:30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase mb-1 block">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editingLesson.description}
                        onChange={(e) =>
                          setEditingLesson((p) => ({
                            ...p!,
                            description: e.target.value,
                          }))
                        }
                        className="neu-input w-full px-3 py-2 text-sm text-foreground"
                        placeholder="Brief description of this lesson"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={addOrUpdateLesson}
                        className="neu-btn-blue px-3 py-2 text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3 h-3" />{' '}
                        {editingLessonIndex !== null ? 'Update' : 'Add'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLesson(null);
                          setEditingLessonIndex(null);
                        }}
                        className="neu-btn px-3 py-2 text-xs bg-secondary text-foreground cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Add Lesson Button */}
                <button
                  onClick={() => {
                    setEditingLesson({
                      title: '',
                      youtubeId: '',
                      duration: '',
                      description: '',
                    });
                    setEditingLessonIndex(null);
                  }}
                  className="neu-btn px-3 py-2 text-xs inline-flex items-center gap-1 cursor-pointer w-full justify-end"
                >
                  <Plus className="w-3 h-3" /> Add Lesson
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={saveCourse}
                className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Course
              </button>
              <button
                onClick={() => setEditingCourse(null)}
                className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {coursesList.length} Courses
          </h3>
          <button
            onClick={() => openCourseEditor()}
            className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Course
          </button>
        </div>
        {coursesList.map((course) => {
          const thumbUrl = getImageUrl(course.thumbnail);
          const imageFailedToLoad = failedImages.has(course.thumbnail || '');
          return (
            <div key={course.id} className="neu-card p-5 flex items-center gap-4">
              {thumbUrl && !imageFailedToLoad ? (
                <img
                  src={thumbUrl}
                  alt=""
                  className="w-20 h-14 object-cover border-2 border-foreground shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setFailedImages((prev) =>
                      new Set([...prev, course.thumbnail || ''])
                    );
                  }}
                />
              ) : (
                <div className="w-20 h-14 bg-secondary border-2 border-foreground flex items-center justify-center shrink-0 text-xs text-muted-foreground">
                  No Image
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{course.title}</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {course.lessons.length} lessons · {course.category} ·{' '}
                  {course.difficulty}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openCourseEditor(course)}
                  className="p-2 border-2 border-foreground bg-secondary hover:bg-primary/20 cursor-pointer"
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="p-2 border-2 border-foreground bg-destructive/20 hover:bg-destructive/40 cursor-pointer"
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
