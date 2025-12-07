import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import CreateLessonModal from '../components/Lessons/CreateLessonModal';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import '../css/Lessons.css';

const Lessons = () => {
    const [lessons, setLessons] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const API_COURSES_URL = 'https://zhalalov2.su/backend-school/courses';
    const API_LESSONS_URL = 'https://zhalalov2.su/backend-school/lessons';
    const [courses, setCourses] = useState([]);
    const { user } = useAuth();
    const userId = user?.id != null ? String(user.id) : null;
    const API_ENROLLMENTS_URL = 'https://zhalalov2.su/backend-school/course_enrollments';
    const API_LESSON_PROGRESS_URL = 'https://zhalalov2.su/backend-school/lesson_progress';
    const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
    const [completedLessonIds, setCompletedLessonIds] = useState(new Set());

    const getCourse = useCallback(async () => {
        try {
            const response = await axios.get(API_COURSES_URL);
            if (response.status === 200) {
                let arr_course = [];
                if (Array.isArray(response.data)) {
                    arr_course = response.data[1];
                } else {
                    const values = Object.values(response.data);
                    if (Array.isArray(values[1])) {
                        arr_course = values[1];
                    } else if (Array.isArray(values[0])) {
                        arr_course = values[0];
                    } else {
                        arr_course = values;
                    }
                }
                setCourses(arr_course);
            }
        } catch (err) {
            setCompletedLessonIds(new Set());
        }
    }, [API_COURSES_URL]);

    const handleCreate = async (res) => {
        try {
            const body = new URLSearchParams();
            body.append('title', res.title);
            body.append('content', res.content);
            body.append('course_id', res.course_id);

            const response = await axios.post(API_LESSONS_URL, body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000,
            });

            if (response.status === 200 || response.status === 201) {
                const newLesson = response.data;
                setLessons(prev => [newLesson, ...prev]);
                setIsModalOpen(false);
            } else {
                alert('Не удалось создать урок');
            }
        } catch (err) {
            alert('Ошибка при создании урока');
        }
    };

    const getLessons = useCallback(async () => {
        try {
            const response = await axios.get(API_LESSONS_URL);
            if (response.status === 200) {
                let arr_lessons = [];
                if (Array.isArray(response.data)) {
                    arr_lessons = response.data[1];
                } else {
                    const values = Object.values(response.data);
                    if (Array.isArray(values[1])) {
                        arr_lessons = values[1];
                    } else if (Array.isArray(values[0])) {
                        arr_lessons = values[0];
                    } else {
                        arr_lessons = values;
                    }
                }
                const filtered = arr_lessons.filter(l => {
                    if (!user || user.role !== 'Student') return true;
                    return enrolledCourseIds.has(String(l.course_id));
                });
                setLessons(filtered);
            }
        } catch (err) {
            setLessons([]);
        }
    }, [API_LESSONS_URL, enrolledCourseIds, user]);

    const fetchEnrollments = useCallback(async () => {
        if (!userId) {
            setEnrolledCourseIds(new Set());
            return new Set();
        }
        try {
            const response = await axios.get(API_ENROLLMENTS_URL, { params: { user_id: userId } });
            const raw = response.data?.data ?? response.data ?? [];
            const values = Array.isArray(raw) ? raw : Object.values(raw || {});
            const collected = new Set();
            values.forEach(item => {
                if (!item) return;
                const courseId = item.course_id ?? item.courseId ?? item.id ?? null;
                if (courseId != null) {
                    collected.add(String(courseId));
                }
            });
            setEnrolledCourseIds(collected);
            return collected;
        } catch (err) {
            setEnrolledCourseIds(new Set());
            return new Set();
        }
    }, [userId]);

    const fetchLessonProgress = useCallback(async () => {
        if (!userId) {
            setCompletedLessonIds(new Set());
            return new Set();
        }
        try {
            const response = await axios.get(API_LESSON_PROGRESS_URL, { params: { user_id: userId } });
            const raw = response.data?.data ?? response.data ?? [];
            const values = Array.isArray(raw) ? raw : Object.values(raw || {});
            const collected = new Set();
            values.forEach(item => {
                if (!item) return;
                const lessonId = item.lesson_id ?? item.lessonId ?? item.id ?? null;
                if (lessonId == null) return;
                const statusValue = (item.status || '').toString().toLowerCase();
                const percentValue = Number(item.progress_percent ?? item.progress_precent ?? item.progress ?? 0);
                if (statusValue === 'completed' || percentValue >= 100) {
                    collected.add(String(lessonId));
                }
            });
            setCompletedLessonIds(collected);
            return collected;
        } catch (err) {
            setCompletedLessonIds(new Set());
            return new Set();
        }
    }, [userId, API_LESSON_PROGRESS_URL]);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    useEffect(() => {
        fetchLessonProgress();
    }, [fetchLessonProgress]);

    useEffect(() => {
        getLessons();
    }, [getLessons]);

    useEffect(() => {
        getCourse();
    }, [getCourse]);

    return (
        <div className="container lessons-page">
            <div className="card">
                <div className="card-body">
                    <h1>Уроки</h1>
                    <p>Список уроков.</p>

                    <div className="lessons-actions">
                        {user && user.role === 'Teacher' && (
                            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                                Добавить урок
                            </button>
                        )}
                        {!user && (
                            <div style={{ color: '#666' }}>
                                Войдите как преподаватель, чтобы добавлять уроки.
                            </div>
                        )}
                    </div>

                    <ul className="lessons-list">
                        {lessons.length === 0 ? (
                            <li>Пока нет уроков.</li>
                        ) : (
                            lessons.map(l => {
                                const course = courses.find(c => String(c.id) === String(l.course_id)) || { title: 'Без курса' };
                                const created = l.createdAt || l.created_at || l.created || null;
                                const isEnrolled = enrolledCourseIds.has(String(l.course_id));
                                const finished = completedLessonIds.has(String(l.id));
                                return (
                                    <li key={l.id} className="lessons-item">
                                        <div className="lesson-card">
                                            <div className="lesson-row">
                                                <div className="lesson-main">
                                                    <h3 className="lesson-title">{l.title}</h3>
                                                    {l.content && <div className="lesson-content">{l.content}</div>}
                                                    <div className="lesson-meta">Курс: {course.title}</div>
                                                    {finished && (
                                                        <div className="lesson-finished">
                                                            <span className="lesson-finished-dot" />
                                                            Урок завершён
                                                        </div>
                                                    )}
                                                    <div className="lesson-actions">
                                                        {!isEnrolled ? (
                                                            (user && user.role === 'Student') ? (
                                                                <button className="btn btn-outline" onClick={() => {
                                                                    if (!userId) {
                                                                        alert('Необходимо войти в систему, чтобы записаться на курс');
                                                                        return;
                                                                    }
                                                                    const payload = new URLSearchParams();
                                                                    payload.append('user_id', userId);
                                                                    payload.append('course_id', String(l.course_id));
                                                                    axios.post(API_ENROLLMENTS_URL, payload.toString(), {
                                                                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                                                        timeout: 15000,
                                                                    }).then(async () => {
                                                                        await fetchEnrollments();
                                                                        getLessons();
                                                                        getCourse();
                                                                    }).catch(err => {
                                                                        alert('Не удалось записаться на курс');
                                                                    });
                                                                }}>
                                                                    Записаться на курс
                                                                </button>
                                                            ) : (
                                                                <div style={{ color: '#666' }}>
                                                                    Только студенты могут записываться на курс
                                                                </div>
                                                            )
                                                        ) : (
                                                            (user && user.role === 'Student') ? (
                                                                <>
                                                                    <Link to={`/lessons/${l.id}`}>
                                                                        <button className="btn btn-primary">
                                                                            Открыть урок
                                                                        </button>
                                                                    </Link>
                                                                    {!finished ? (
                                                                        <button style={{ marginLeft: 8 }} className="btn btn-outline" onClick={() => {
                                                                            if (!userId) {
                                                                                alert('Необходимо войти в систему, чтобы отмечать прогресс');
                                                                                return;
                                                                            }
                                                                            const payload = new URLSearchParams();
                                                                            payload.append('user_id', userId);
                                                                            payload.append('lesson_id', String(l.id));
                                                                            payload.append('status', 'completed');
                                                                            payload.append('completed_at', new Date().toISOString());
                                                                            payload.append('progress_percent', '100');
                                                                            axios.post(API_LESSON_PROGRESS_URL, payload.toString(), {
                                                                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                                                                timeout: 15000,
                                                                            }).then(async () => {
                                                                                alert('Урок отмечен как завершённый. Тест теперь доступен.');
                                                                                try {
                                                                                    localStorage.setItem('lesson_progress_changed', String(Date.now()));
                                                                                } catch (e) {
                                                                                    // ignore
                                                                                }
                                                                                await fetchLessonProgress();
                                                                                getLessons();
                                                                            }).catch(err => {
                                                                                alert('Не удалось сохранить прогресс урока');
                                                                            });
                                                                        }}>
                                                                            Завершить урок
                                                                        </button>
                                                                    ) : (
                                                                        <button style={{ marginLeft: 8 }} className="btn btn-success" onClick={() => alert('Открыть тест для этого урока')}>
                                                                            Сдать тест
                                                                        </button>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div style={{ color: '#666' }}>
                                                                    Только студенты могут проходить уроки/тесты
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="lesson-meta-right">
                                                {created ? new Date(created).toLocaleString() : ''}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            </div>
            {isModalOpen && (
                <CreateLessonModal
                    courses={courses.length ? courses : [{ id: 'c1', title: 'Без курса' }]}
                    onClose={() => setIsModalOpen(false)}
                    onCreate={handleCreate}
                />
            )}
        </div>
    );
};

export default Lessons;
