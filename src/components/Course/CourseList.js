import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';
import '../../css/Course.css';
import { API_URL_BASE } from '../../utils/API_URL_CONF';
import axios from 'axios';
import Spinner from '../Spinner';

const CourseList = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const API_URL = `${API_URL_BASE}/courses`;
  const API_ENROLLMENTS_URL = `${API_URL_BASE}/course_enrollments`;
  const userId = user?.id != null ? String(user.id) : null;
  

  const fetchEnrollments = useCallback(async () => {
    if (!userId) {
      return new Set();
    }
    try {
      const response = await axios.get(API_ENROLLMENTS_URL, { params: { user_id: userId } });
      const raw = response.data?.data ?? response.data ?? [];
      const values = Array.isArray(raw) ? raw : Object.values(raw || {});
      const collected = new Set();
      values.forEach(item => {
        if (!item) return;
        const courseId = item.course_id ?? item.courseId ?? item.id ?? item[1] ?? null;
        if (courseId != null) {
          collected.add(String(courseId));
        }
      });
      return collected;
    } catch (err) {
      return new Set();
    }
  }, [API_ENROLLMENTS_URL, userId]);

  useEffect(() => {
    const loadCourses = async () => {
      setIsLoading(true);

      const normalizeToArray = (payload) => {
        if (!payload) return [];

        if (Array.isArray(payload) && payload.length > 0 && Array.isArray(payload[0]) && payload[0].length === 2 && typeof payload[0][0] === 'string') {
          try {
            const obj = Object.fromEntries(payload);
            if (Array.isArray(obj.data)) return obj.data;
            const firstArr = Object.values(obj).find(v => Array.isArray(v));
            return Array.isArray(firstArr) ? firstArr : [];
          } catch (e) {
            return [];
          }
        }

        if (Array.isArray(payload)) return payload;

        if (typeof payload === 'object') {
          if (Array.isArray(payload.data)) return payload.data;
          const vals = Object.values(payload);
          if (vals.length > 0 && vals.every(v => typeof v === 'object')) return vals;
          return [];
        }

        return [];
      };

      try {
        const enrollmentSet = await fetchEnrollments();
        const response = await axios.get(API_URL);
        const data = normalizeToArray(response.data);
        const withEnroll = data.map(c => ({
          ...c,
          enrolled: enrollmentSet.has(String(c.id)) || Boolean(c.enrolled),
        }));
        setCourses(withEnroll);
        setFilteredCourses(withEnroll);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadCourses();
  }, [API_URL, fetchEnrollments]);

  useEffect(() => {
  let filtered = Array.isArray(courses) ? courses.slice() : [];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(course => {
        if (!course || typeof course !== 'object') return false;
        const title = (course.title || course.name || '').toString().toLowerCase();
        const desc = (course.description || course.desc || '').toString().toLowerCase();
        const teacher = (course.teacher_name || course.teacher || course.teacherName || '').toString().toLowerCase();
        return title.includes(q) || desc.includes(q) || teacher.includes(q);
      });
    }

    if (selectedFilter !== 'all') {
      if (selectedFilter === 'enrolled') {
        filtered = filtered.filter(course => Boolean(course && course.enrolled));
      } else if (selectedFilter === 'available') {
        filtered = filtered.filter(course => !Boolean(course && course.enrolled));
      } else if (selectedFilter === 'completed') {
        filtered = filtered.filter(course => Number(course && course.progress) === 100);
      } else if (selectedFilter === 'in-progress') {
        filtered = filtered.filter(course => {
          const p = Number(course && course.progress) || 0;
          return p > 0 && p < 100;
        });
      }
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedFilter]);

  const handleEnroll = async (courseId) => {
    try {
      if (!userId) {
        alert('Необходимо войти в систему, чтобы записаться на курс');
        return;
      }
      const payload = new URLSearchParams();
      payload.append('user_id', userId);
      payload.append('course_id', String(courseId));
      await axios.post(API_ENROLLMENTS_URL, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });
      const enrollmentSet = await fetchEnrollments();
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, enrolled: true, students_count: (course.students_count || 0) + 1 }
          : { ...course, enrolled: enrollmentSet.has(String(course.id)) }
      ));
      setFilteredCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, enrolled: true }
          : { ...course, enrolled: enrollmentSet.has(String(course.id)) }
      ));
    } catch (error) {
      // ignore
    }
  };

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="courses-container">
      <div className="container">
        <div className="courses-header">
          <div className="courses-title-section">
            <h1 className="courses-title">Все курсы</h1>
            <p className="courses-subtitle">
              Выберите курс и начните свое обучение уже сегодня
            </p>
          </div>
          
          {user && user.role === 'teacher' && (
            <Link to="/teacher/courses/create" className="btn btn-primary">
              <svg className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Создать курс
            </Link>
          )}
        </div>

        <div className="courses-filters">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Поиск курсов по названию или преподавателю..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              Все курсы
            </button>
            
            {user && user.role === 'student' && (
              <>
                <button
                  className={`filter-tab ${selectedFilter === 'enrolled' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('enrolled')}
                >
                  Мои курсы
                </button>
                <button
                  className={`filter-tab ${selectedFilter === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('in-progress')}
                >
                  В процессе
                </button>
                <button
                  className={`filter-tab ${selectedFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('completed')}
                >
                  Завершенные
                </button>
                <button
                  className={`filter-tab ${selectedFilter === 'available' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('available')}
                >
                  Доступные
                </button>
              </>
            )}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Курсы не найдены</h3>
            <p>
              {searchTerm 
                ? `По запросу "${searchTerm}" ничего не найдено. Попробуйте изменить поисковый запрос.`
                : 'В данной категории пока нет курсов.'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="btn btn-outline"
              >
                Сбросить поиск
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="courses-stats">
              <span className="courses-count">
                Найдено курсов: {filteredCourses.length}
              </span>
            </div>
            
            <div className="courses-grid">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  user={user}
                  onEnroll={handleEnroll}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseList;
