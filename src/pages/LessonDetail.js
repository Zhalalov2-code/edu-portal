import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../utils/authContext';
import '../css/LessonDetail.css';

const LessonDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_LESSON_PROGRESS_URL = 'https://zhalalov2.su/backend-school/lesson_progress';
  const [isCompleted, setIsCompleted] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const url = `https://zhalalov2.su/backend-school/lessons/${id}`;
        const res = await axios.get(url);
        if (res.status === 200) {
          let data = res.data?.data ?? res.data ?? null;

          if (Array.isArray(data)) {
            let found = null;
            for (const item of data) {
              if (found) break;
              if (Array.isArray(item)) {
                for (const sub of item) {
                  if (sub && String(sub.id) === String(id)) { found = sub; break; }
                }
              } else if (item && typeof item === 'object') {
                if (String(item.id) === String(id)) { found = item; break; }
              }
            }
            if (!found) {
              const firstObj = data.find(d => d && typeof d === 'object');
              found = firstObj || null;
            }
            data = found;
          }
          setLesson(data);
        } else {
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  useEffect(() => {
    if (!user || !user.id) {
      setIsCompleted(false);
      return;
    }

    let mounted = true;

    const loadProgress = async () => {
      try {
        const response = await axios.get(API_LESSON_PROGRESS_URL, { params: { user_id: user.id } });
        const raw = response.data?.data ?? response.data ?? [];
        const list = Array.isArray(raw) ? raw : Object.values(raw || {});
        const completed = list.some(item => {
          if (!item) return false;
          const lessonId = item.lesson_id ?? item.lessonId ?? item.id ?? null;
          if (lessonId == null) return false;
          const statusValue = (item.status || '').toString().toLowerCase();
          const percentValue = Number(item.progress_percent ?? item.progress_precent ?? item.progress ?? 0);
          return String(lessonId) === String(id) && (statusValue === 'completed' || percentValue >= 100);
        });
        if (mounted) setIsCompleted(completed);
      } catch (e) {
        if (mounted) setIsCompleted(false);
      }
    };
    loadProgress();

    return () => { mounted = false; };
  }, [id, user]);

  const handleFinish = async () => {
    if (!user || !user.id) {
      alert('Необходимо войти в систему, чтобы отмечать прогресс');
      return;
    }
    if (isCompleted) {
      alert('Урок уже отмечен как завершённый');
      return;
    }
    try {
      setSavingProgress(true);
      const payload = new URLSearchParams();
      payload.append('user_id', user.id);
      payload.append('lesson_id', id);
      payload.append('status', 'completed');
      payload.append('status', 'completed');
      payload.append('progress_precent', '100');

      const response = await axios.post(API_LESSON_PROGRESS_URL, payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });
      if (response.status === 200 || response.status === 201) {
        setIsCompleted(true);
        try { localStorage.setItem('lesson_progress_changed', String(Date.now())); } catch (e) { /* ignore */ }
        alert('Урок отмечен как завершённый!');
      } else {
        alert('Не удалось сохранить прогресс урока');
      }
    } catch (e) {
      alert('Не удалось сохранить прогресс урока');
    }
    finally {
      setSavingProgress(false);
    }
  };

  const handleGoTest = () => {
    navigate('/test', { state: { lessonId: id } });
  };

  if (loading) return <div className="container ld-loading">Загрузка...</div>;
  if (!lesson) return <div className="container ld-loading">Урок не найден</div>;

  const contentHtml = lesson.content || '';

  return (
    <div className="container ld-page">
      <div className="card">
        <div className="card-body">
          <h1>{lesson.title || lesson.name || 'Урок'}</h1>
          <div className="ld-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />

          <div className="ld-actions">
            <button
              className="btn btn-primary"
              onClick={handleFinish}
              disabled={!user || savingProgress || isCompleted}
            >
              {isCompleted ? 'Урок завершён' : 'Завершить урок'}
            </button>
            <button className="btn btn-outline" onClick={handleGoTest}>Перейти к тесту</button>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Назад</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
