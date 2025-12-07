import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../utils/authContext';
import '../css/TestDetail.css';
import { ensureArrayOptions } from '../utils/options';

const API_TESTS_URL = 'https://zhalalov2.su/backend-school/tests';
const API_RESULTS_URL = 'https://zhalalov2.su/backend-school/results';
const API_LESSON_PROGRESS_URL = 'https://zhalalov2.su/backend-school/lesson_progress';

const TestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const userId = user?.id != null ? String(user.id) : null;

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [completedLessons, setCompletedLessons] = useState(new Set());

    useEffect(() => {
        let mounted = true;

        async function fetchTest() {
            if (!mounted) return;
            setLoading(true);
            try {
                const url = `${API_TESTS_URL}/${id}`;
                const res = await axios.get(url);
                if (res.status === 200) {
                    let data = res.data?.data ?? res.data ?? null;

                    if (Array.isArray(data)) {
                        let found = null;
                        for (const item of data) {
                            if (found) break;
                            if (Array.isArray(item)) {
                                for (const sub of item) {
                                    if (sub && String(sub.id) === String(id)) {
                                        found = sub;
                                        break;
                                    }
                                }
                            } else if (item && typeof item === 'object') {
                                if (String(item.id) === String(id)) {
                                    found = item;
                                    break;
                                }
                            }
                        }
                        if (!found) found = data.find(d => d && typeof d === 'object') || null;
                        data = found;
                    }

                    if (data && mounted) {
                        const normalized = {
                            id: data.id ?? data.test_id ?? data[0] ?? Number(id),
                            lesson_id: data.lesson_id ?? data.lessonId ?? null,
                            question: data.question ?? data.title ?? String(data.id ?? id),
                            options: [],
                            correct_answer: null,
                            createdAt: data.created_at || data.createdAt || new Date().toISOString(),
                        };

                        const rawOptions = data.options ?? data.opts ?? [];
                        normalized.options = ensureArrayOptions(rawOptions);

                        const ca = data.correct_answer ?? data.correctAnswer ?? data.answer ?? null;
                        if (typeof ca === 'number') {
                            normalized.correct_answer = ca;
                        } else if (typeof ca === 'string') {
                            const maybeNumber = Number(ca);
                            if (!Number.isNaN(maybeNumber) && ca.trim() !== '' && String(maybeNumber) === ca.trim()) {
                                normalized.correct_answer = maybeNumber;
                            } else if (normalized.options.length > 0) {
                                const idx = normalized.options.findIndex(o => o === ca);
                                normalized.correct_answer = idx >= 0 ? idx : ca;
                            } else {
                                normalized.correct_answer = ca;
                            }
                        } else {
                            if (normalized.options.length > 0) {
                                const idx = normalized.options.findIndex(o => o === ca);
                                normalized.correct_answer = idx >= 0 ? idx : ca;
                            } else {
                                normalized.correct_answer = ca;
                            }
                        }

                        setTest(normalized);
                    } else if (mounted) {
                        setTest(null);
                    }
                }
            } catch (err) {
                setTest(null);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchTest();

        return () => {
            mounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (!userId) {
            setCompletedLessons(new Set());
            return;
        }

        let mounted = true;

        const loadProgress = async () => {
            try {
                const response = await axios.get(API_LESSON_PROGRESS_URL, { params: { user_id: userId } });
                const raw = response.data?.data ?? response.data ?? [];
                const values = Array.isArray(raw) ? raw : Object.values(raw || {});
                const collected = new Set();
                values.forEach(item => {
                    if (!item) return;
                    const lessonId = item.lesson_id ?? item.lessonId ?? null;
                    if (lessonId == null) return;
                    const statusValue = (item.status || '').toString().toLowerCase();
                    const percentValue = Number(item.progress_percent ?? item.progress_precent ?? item.progress ?? 0);
                    if (statusValue === 'completed' || percentValue >= 100) {
                        collected.add(String(lessonId));
                    }
                });
                if (mounted) setCompletedLessons(collected);
            } catch (err) {
                if (mounted) setCompletedLessons(new Set());
            }
        };

        loadProgress();

        return () => {
            mounted = false;
        };
    }, [userId]);

    const canTake = () => {
        if (user && user.role && user.role.toLowerCase().includes('teacher')) return true;
        if (test && test.lesson_id) return completedLessons.has(String(test.lesson_id));
        return true;
    };

    const handleSubmit = async () => {
        if (!test) return;
        if (selected === null || selected === undefined) {
            alert('Выберите вариант ответа перед отправкой');
            return;
        }
        if (!canTake()) {
            alert('Вы должны сначала завершить связанный урок, чтобы пройти тест');
            return;
        }
        if (!user || !user.id) {
            alert('Необходима авторизация для отправки результатов');
            return;
        }
        if (submitting) return;

        const ca = test.correct_answer;
        let ok = false;
        if (typeof ca === 'number') {
            ok = Number(selected) === Number(ca);
        } else if (typeof ca === 'string') {
            ok = String(test.options[selected]) === String(ca);
        } else {
            ok = String(test.options[selected]) === String(ca);
        }

        const score = ok ? 100 : 0;
        setResult({ ok, score });

        try {
            const storageKey = user?.id != null ? `completedTests_${user.id}` : 'completedTests_guest';
            const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const arr = new Set(Array.isArray(stored) ? stored.map(String) : []);
            arr.add(String(test.id));
            localStorage.setItem(storageKey, JSON.stringify(Array.from(arr)));
        } catch (e) {
            // ignore
        }

        const answerIndex = Number(selected);
        if (Number.isNaN(answerIndex)) {
            alert('Не удалось определить выбранный ответ. Попробуйте ещё раз.');
            return;
        }

        try {
            setSubmitting(true);
            const payload = new URLSearchParams();
            const payloadObject = {
                user_id: String(user.id),
                test_id: String(test.id),
                user_answer: String(answerIndex),
                is_correct: ok ? '1' : '0',
            };
            Object.entries(payloadObject).forEach(([key, value]) => {
                payload.append(key, value);
            });

            await axios.post(API_RESULTS_URL, payload.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000,
            });
        } catch (err) {
            // ignore
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="container td-loading">Загрузка теста...</div>;
    if (!test) return <div className="container td-loading">Тест не найден</div>;

    return (
        <div className="container td-page">
            <div className="card">
                <div className="card-body">
                    <h1>Тест: {test.question}</h1>
                    <div className="td-options">
                        {test.options && test.options.length > 0 ? (
                            <div>
                                {test.options.map((opt, i) => (
                                    <label key={i} className="td-option-label">
                                        <input
                                            type="radio"
                                            name="test-option"
                                            value={i}
                                            checked={String(selected) === String(i)}
                                            onChange={() => setSelected(i)}
                                            disabled={!canTake()}
                                            className="td-radio"
                                        />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p>У этого теста нет вариантов ответов.</p>
                        )}
                    </div>

                    <div className="td-actions">
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={!canTake()}>
                            Отправить ответы
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate(`/lessons/${test.lesson_id}`)} disabled={!test.lesson_id}>
                            Открыть урок
                        </button>
                        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                            Назад
                        </button>
                    </div>

                    {result && (
                        <div className="td-result">
                            <strong>Результат:</strong> {result.ok ? 'Пройден' : 'Не пройден'} — {result.score}%
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestDetail;
