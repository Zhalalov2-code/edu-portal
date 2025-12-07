import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import CourseList from './components/Course/CourseList';
import Test from './pages/Test';
import TestDetail from './pages/TestDetail';
import Lessons from './pages/Lessons';
import LessonDetail from './pages/LessonDetail';
import Results from './pages/Results';
import { AuthProvider, useAuth } from './utils/authContext';
import './css/App.css';
import Profile from './pages/profile';
import Chat from './pages/chat';
import AdminPanel from './pages/AdminPanel';

function AppInner() {
  const { user, isLoading, login, logout } = useAuth();

  if (user) {
  }

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    return result;
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner-large"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Все страницы внутри Layout */}
      <Route path="*" element={
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
        <Route
          path="/"
          element={<HomePage user={user} />}
        />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />
          }
        />
        <Route
          path="/courses"
          element={<CourseList user={user} />}
        />
        <Route
          path="/chat"
          element={
            user ? <Chat /> : <Navigate to="/login" />
          }
        />

        {/* Временные заглушки для других маршрутов */}
        <Route
          path="/courses/:id"
          element={
            <div className="container container-padded">
              <div className="card">
                <div className="card-body">
                  <h1>Страница курса</h1>
                  <p>Эта страница будет реализована в следующих компонентах</p>
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Profile />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'Admin' ? (
              <AdminPanel />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            user && user.role === 'Teacher' ? (
              <TeacherDashboard user={user} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/test" element={<Test />} />
        <Route path="/tests/:id" element={<TestDetail />} />
        <Route path="/lessons" element={<Lessons />} />
        <Route path="/results" element={<Results />} />
        <Route path="/lessons/:id" element={<LessonDetail />} />

        {/* 404 страница */}
        <Route
          path="*"
          element={
            <div className="container empty-page">
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Страница не найдена</h3>
                <p>Запрашиваемая страница не существует</p>
                <a href="/" className="btn btn-primary">
                  Вернуться на главную
                </a>
              </div>
            </div>
          }
        />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </Router>
  );
}

export default App;
