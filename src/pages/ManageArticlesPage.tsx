import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Article } from '@/data/mockData';
import { Plus, Trash2, Edit3, Save, X, RefreshCw, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { RichTextEditor } from '@/components/RichTextEditor';
import { articlesAPI } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

export default function ManageArticlesPage() {
  const { isAdmin } = useAuth();
  const [articlesList, setArticlesList] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Article editor state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    tags: '',
    images: [] as string[],
  });
  const [imageUrl, setImageUrl] = useState('');
  const articleImageInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const articlesRes = await articlesAPI.getAll();
      const transformedArticles = articlesRes.data.map((a: any) => ({
        id: a._id,
        title: a.title,
        content: a.content,
        images: a.images || [],
        author: a.author || 'Admin',
        createdAt: a.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        tags: a.tags || [],
      }));
      setArticlesList(transformedArticles);
    } catch (error) {
      setArticlesList([]);
    } finally {
      setIsLoading(false);
    }
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

  const openArticleEditor = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        title: article.title,
        content: article.content,
        tags: article.tags.join(', '),
        images: article.images,
      });
    } else {
      setEditingArticle({
        id: '',
        title: '',
        content: '',
        tags: [],
        images: [],
        author: 'Admin User',
        createdAt: new Date().toISOString().split('T')[0],
      });
      setArticleForm({ title: '', content: '', tags: '', images: [] });
    }
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) {
      alert('Please enter a valid URL');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('URL must start with http:// or https://');
      return;
    }
    const normalizedUrl = url.includes('drive.google.com')
      ? normalizeGoogleDriveUrl(url)
      : url;
    setArticleForm((p) => ({ ...p, images: [...p.images, normalizedUrl] }));
    setImageUrl('');
  };

  const removeArticleImage = (index: number) => {
    setArticleForm((p) => ({
      ...p,
      images: p.images.filter((_, i) => i !== index),
    }));
  };

  const saveArticle = async () => {
    if (!editingArticle || !articleForm.title || !articleForm.content) {
      alert('Title and content are required');
      return;
    }

    const article: Article = {
      ...editingArticle,
      id: editingArticle.id || String(Date.now()),
      title: articleForm.title,
      content: articleForm.content,
      tags: articleForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      images: articleForm.images,
    };

    try {
      if (editingArticle.id) {
        await articlesAPI.update(article.id, {
          title: article.title,
          content: article.content,
          tags: article.tags,
          images: article.images,
        });
        setArticlesList((p) =>
          p.map((a) => (a.id === article.id ? article : a))
        );
      } else {
        const response = await articlesAPI.create({
          title: article.title,
          content: article.content,
          tags: article.tags,
          images: article.images,
        });
        setArticlesList((p) => [
          ...p,
          { ...article, id: response.data._id },
        ]);
      }
      setEditingArticle(null);
    } catch (error) {
      alert('Failed to save article');
    }
  };

  const deleteArticle = async (id: string) => {
    if (!window.confirm('Delete this article?')) return;
    try {
      await articlesAPI.delete(id);
      setArticlesList((p) => p.filter((a) => a.id !== id));
    } catch (error) {
      alert('Failed to delete article');
    }
  };

  const cleanupBrokenImages = async () => {
    const confirmCleanup = window.confirm(
      'This will remove ALL broken server image URLs from ALL articles in the database. This cannot be undone. Continue?'
    );
    if (!confirmCleanup) return;

    try {
      setIsLoading(true);
      const response = await articlesAPI.cleanupBrokenImages();
      const { cleanedCount } = response.data;

      if (cleanedCount > 0) {
        alert(`✅ Cleaned database! Removed broken images from ${cleanedCount} article(s).`);
        await loadArticles();
      } else {
        alert('ℹ️ No broken images found in database.');
      }
    } catch (error) {
      alert('Failed to cleanup broken images');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> MANAGE ARTICLES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">CREATE AND MANAGE YOUR ARTICLES</p>
      </div>

      {/* Article Editor Modal */}
      {editingArticle && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-card-blue p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {editingArticle.id ? 'Edit Article' : 'New Article'}
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
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
                  value={articleForm.title}
                  onChange={(e) =>
                    setArticleForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Content
                </label>
                <RichTextEditor
                  value={articleForm.content}
                  onChange={(content) =>
                    setArticleForm((p) => ({ ...p, content }))
                  }
                  placeholder="Write your article content here..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Tags (comma separated)
                </label>
                <input
                  value={articleForm.tags}
                  onChange={(e) =>
                    setArticleForm((p) => ({ ...p, tags: e.target.value }))
                  }
                  className="neu-input w-full px-4 py-3 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Image URLs
                </label>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Paste Google Drive image URL here..."
                    className="neu-input flex-1 px-4 py-2 text-sm text-foreground font-mono"
                    onKeyPress={(e) => e.key === 'Enter' && addImageUrl()}
                  />
                  <button
                    onClick={addImageUrl}
                    className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" /> Add
                  </button>
                </div>
                {articleForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {articleForm.images.map((img, idx) => {
                      const imageUrl = getImageUrl(img);
                      return imageUrl ? (
                        <div key={idx} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Article ${idx}`}
                            className="w-full h-24 object-cover border-3 border-border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <button
                            onClick={() => removeArticleImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 border border-white cursor-pointer hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          key={idx}
                          className="relative h-24 bg-secondary border-3 border-border flex items-center justify-center text-xs text-muted-foreground"
                        >
                          <span>Broken: {img.substring(0, 20)}...</span>
                          <button
                            onClick={() => removeArticleImage(idx)}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 border border-white cursor-pointer hover:bg-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No images added yet
                  </div>
                )}
              </div>

              {articleForm.content && (
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                    Preview
                  </label>
                  <div
                    className="p-4 bg-secondary border-3 border-border prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: articleForm.content }}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveArticle}
                  className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Article
                </button>
                <button
                  onClick={() => setEditingArticle(null)}
                  className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Articles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold uppercase tracking-wider">
              {articlesList.length} Articles
            </h3>
            <button
              onClick={loadArticles}
              disabled={isLoading}
              className="p-1 border border-foreground hover:bg-primary/20 cursor-pointer disabled:opacity-50"
              title="Refresh articles from database"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={cleanupBrokenImages}
              className="neu-btn px-3 py-2 text-xs inline-flex items-center gap-1 cursor-pointer"
              style={{ background: '#FCA50030', boxShadow: '1px 1px 0px #FCA500' }}
            >
              🧹 Cleanup Images
            </button>
            <button
              onClick={() => openArticleEditor()}
              className="neu-btn-blue px-4 py-2 text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Article
            </button>
          </div>
        </div>
        {articlesList.map((article) => {
          const articleThumbUrl =
            article.images && article.images.length > 0
              ? getImageUrl(article.images[0])
              : '';
          const imageFailedToLoad = failedImages.has(article.images?.[0] || '');

          return (
            <div key={article.id} className="neu-card p-5 flex items-center gap-4">
              {articleThumbUrl && !imageFailedToLoad ? (
                <img
                  src={articleThumbUrl}
                  alt=""
                  className="w-20 h-14 object-cover border-2 border-foreground shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    setFailedImages((prev) =>
                      new Set([...prev, article.images?.[0] || ''])
                    );
                  }}
                />
              ) : (
                <div className="w-20 h-14 bg-secondary border-2 border-foreground flex items-center justify-center shrink-0 text-xs text-muted-foreground">
                  No Image
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{article.title}</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  {article.tags.join(', ')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openArticleEditor(article)}
                  className="p-2 border-2 border-foreground bg-secondary hover:bg-primary/20 cursor-pointer"
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteArticle(article.id)}
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
