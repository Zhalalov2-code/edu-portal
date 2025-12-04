import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/TeacherDashboard.css';
import axios from 'axios';
import CreateCourseModal from '../components/Course/CreateCourseModal';

const TeacherDashboard = ({ user }) => {
  const [recentCourses, setRecentCourses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = 'https://zhalalov2.su/backend-school';

  const getActivityIcon = (type) => {
    switch (type) {
      case 'enrollment':
        return '👨‍🎓';
      case 'test':
        return '📝';
      case 'lesson':
        return '📚';
      default:
        return '📋';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Активен</span>;
      case 'draft':
        return <span className="badge badge-warning">Черновик</span>;
      case 'archived':
        return <span className="badge badge-error">Архив</span>;
      default:
        return <span className="badge badge-primary">Неизвестно</span>;
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleCreateCourse = async ({ title, description, teacher_id }) => {
    const tid = teacher_id ?? user?.id;
    const payload = new URLSearchParams();
    payload.append('title', title);
    payload.append('description', description);
    payload.append('teacher_id', tid);

    try {
      const resp = await axios.post(`${API_URL}/courses`, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      const created = resp?.data?.data ?? resp?.data ?? null;
      let newCourse = created;
      if (Array.isArray(created) && Array.isArray(created[0]) && typeof created[0][0] === 'string') {
        try { newCourse = Object.fromEntries(created); } catch (e) { }
      }

      const courseObj = Array.isArray(newCourse) ? newCourse[0] : newCourse;

      if (courseObj) {
        setRecentCourses(prev => [courseObj, ...prev]);
      }

      return courseObj;
    } catch (e) {
      console.error('Ошибка создания курса:', e);
      throw e;
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user || !user.id) {
        if (mounted) setIsLoading(false);
        return;
      }

      if (mounted) setIsLoading(true);

      try {
        const response = await axios.get(`${API_URL}/courses`, { params: { teacherId: user.id } });
        let raw = response.data;

        if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0]) && typeof raw[0][0] === 'string') {
          try {
            raw = Object.fromEntries(raw);
          } catch (e) {
            console.warn('Не удалось нормализовать response.data через Object.fromEntries', e);
          }
        }

        const courses = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);

        if (!mounted) return;

        setRecentCourses(courses);

        setRecentActivity([]);
        console.log('Полученные курсы:', response.data);
      } catch (err) {
        console.error('Ошибка при загрузке данных дашборда:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();

    return () => { mounted = false; };
  }, [user]);

  if (isLoading) {
    return (
      <div className="teacher-dashboard">
        <div className="container">
          <div className="loading-state">
            <div className="spinner-large"></div>
            <p>Загружаем данные...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalCourses = recentCourses.length;
  const totalStudents = recentCourses.reduce((acc, c) => acc + (c.students ?? c.student_count ?? 0), 0);
  const totalLessons = recentCourses.reduce((acc, c) => acc + (c.lessons ?? c.lessons_count ?? 0), 0);

  return (
    <>
    <div className="teacher-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title">
              Добро пожаловать, {user?.name}! 👨‍🏫
            </h1>
            <p className="dashboard-subtitle">
              Управляйте своими курсами и отслеживайте прогресс студентов
            </p>
          </div>

          <div className="header-actions">
            <button onClick={openModal} className="btn btn-primary">
              <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Создать курс
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon courses">📚</div>
            <div className="stat-content">
              <div className="stat-number">{totalCourses}</div>
              <div className="stat-label">Курсов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon students">👨‍🎓</div>
            <div className="stat-content">
              <div className="stat-number">{totalStudents}</div>
              <div className="stat-label">Студентов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon lessons">📖</div>
            <div className="stat-content">
              <div className="stat-number">{totalLessons}</div>
              <div className="stat-label">Уроков</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon tests">✅</div>
            <div className="stat-content">
              <div className="stat-number">0</div>
              <div className="stat-label">Тестов пройдено</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Мои курсы</h2>
              <Link to="/teacher/courses" className="section-link">
                Все курсы
                <svg className="link-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>

            <div className="courses-list">
              {recentCourses.length === 0 ? (
                <div className="empty-courses">У вас пока нет курсов</div>
              ) : (
                recentCourses.map((course, idx) => {
                  const id = course?.id ?? course?.course_id ?? idx;
                  const title = course?.title ?? course?.name ?? 'Без названия';
                  const students = course?.students ?? course?.students_count ?? course?.student_count ?? 0;
                  const lessons = course?.lessons ?? course?.lessons_count ?? 0;
                  const updated = course?.updated_at ?? course?.update_at ?? course?.created_at ?? course?.created_ad ?? null;

                  const formatDate = (d) => {
                    try {
                      return d ? new Date(d).toLocaleDateString('ru-RU') : '—';
                    } catch (e) {
                      return '—';
                    }
                  };

                  return (
                    <div key={id} className="course-item">
                      <div className="course-info">
                        <h3 className="course-title">
                          <Link to={`/teacher/courses/${id}`}>
                            {title}
                          </Link>
                        </h3>
                        <div className="course-meta">
                          <span className="meta-item">👨‍🎓 {students} студентов</span>
                          <span className="meta-item">📖 {lessons} уроков</span>
                          <span className="meta-item">📅 Обновлен {formatDate(updated)}</span>
                        </div>
                      </div>

                      <div className="course-actions">
                        {getStatusBadge(course?.status)}
                        <div className="action-buttons">
                          <Link to={`/teacher/courses/${id}/edit`} className="btn btn-secondary btn-sm">Редактировать</Link>
                          <Link to={`/courses/${id}`} className="btn btn-outline btn-sm">Просмотр</Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2 className="section-title">Последняя активность</h2>
            </div>

            <div className="activity-list">
              {recentActivity.map(activity => (
                <div key={activity.id} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="activity-content">
                    <p className="activity-message">{activity.message}</p>
                    <div className="activity-meta">
                      <span className="activity-course">{activity.course}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2 className="section-title">Быстрые действия</h2>
          <div className="actions-grid">
            <Link to="/teacher/courses/create" className="action-card">
              <div className="action-icon">➕</div>
              <h3 className="action-title">Создать курс</h3>
              <p className="action-description">Добавить новый курс для студентов</p>
            </Link>

            <Link to="/teacher/courses" className="action-card">
              <div className="action-icon">📚</div>
              <h3 className="action-title">Мои курсы</h3>
              <p className="action-description">Управление существующими курсами</p>
            </Link>

            <Link to="/teacher/students" className="action-card">
              <div className="action-icon">👥</div>
              <h3 className="action-title">Студенты</h3>
              <p className="action-description">Просмотр списка студентов</p>
            </Link>

            <Link to="/teacher/analytics" className="action-card">
              <div className="action-icon">📊</div>
              <h3 className="action-title">Аналитика</h3>
              <p className="action-description">Статистика и отчеты</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
    <CreateCourseModal
      isOpen={isModalOpen}
      onClose={closeModal}
      onCreate={handleCreateCourse}
      teacherId={user?.id}
    />
    </>
  );
};

export default TeacherDashboard;
