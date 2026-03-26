import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import LandingPage from '@/pages/LandingPage';
import HomePage from '@/pages/HomePage';
import LearnPage from '@/pages/LearnPage';
import ArticlesPage from '@/pages/ArticlesPage';
import QuizzesPage from '@/pages/QuizzesPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPage from '@/pages/AdminPage';
import ManageCoursesPage from '@/pages/ManageCoursesPage';
import ManageArticlesPage from '@/pages/ManageArticlesPage';
import ManageQuizzesPage from '@/pages/ManageQuizzesPage';
import ManageUsersPage from '@/pages/ManageUsersPage';
import LeaderboardPage from '@/pages/LeaderboardPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import DisclaimerPage from '@/pages/DisclaimerPage';
import ContactPage from '@/pages/ContactPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:courseId" element={<LearnPage />} />
            <Route path="/learn/:courseId/:lessonId" element={<LearnPage />} />
            <Route path="/articles" element={<ArticlesPage />} />
            <Route path="/articles/:id" element={<ArticlesPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/quizzes/:id" element={<QuizzesPage />} />
            <Route path="/leaderboard/:id" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/courses" element={<ManageCoursesPage />} />
            <Route path="/admin/articles" element={<ManageArticlesPage />} />
            <Route path="/admin/quizzes" element={<ManageQuizzesPage />} />
            <Route path="/admin/users" element={<ManageUsersPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/disclaimer" element={<DisclaimerPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
