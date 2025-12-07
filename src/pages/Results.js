import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../utils/authContext';
import { ensureArrayOptions } from '../utils/options';
import '../css/Results.css';

const API_RESULTS_URL = 'https://zhalalov2.su/backend-school/results';
const API_TESTS_URL = 'https://zhalalov2.su/backend-school/tests';

const extractArray = (payload) => {
    if (!payload) return [];

    if (Array.isArray(payload)) {
        if (Array.isArray(payload[1])) return payload[1];
        return payload;
    }

    const values = Object.values(payload);
    if (Array.isArray(values[1])) return values[1];
    if (Array.isArray(values[0])) return values[0];
    return values;
};

const normalizeTest = (item) => {
    if (!item) return null;

    if (Array.isArray(item) && item.length >= 2 && typeof item[1] === 'object') {
        return normalizeTest(item[1]);
    }

    const obj = typeof item === 'object' ? item : { id: item, question: String(item) };

    const id = obj.id ?? obj.test_id ?? obj[0] ?? null;
    if (id == null) return null;

    const lessonId = obj.lesson_id ?? obj.lessonId ?? null;
    const question = obj.question ?? obj.title ?? `Тест #${id}`;
    const rawOptions = obj.options ?? obj.opts ?? [];

    return {
        id: String(id),
        question,
        lessonId: lessonId != null ? String(lessonId) : null,
        options: ensureArrayOptions(rawOptions),
    };
};

const parseIsCorrect = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const lowered = value.trim().toLowerCase();
        if (['1', 'true', 'yes', 'ok', 'passed', 'success'].includes(lowered)) return true;
        if (['0', 'false', 'no', 'fail', 'failed'].includes(lowered)) return false;
    }
    return Boolean(value);
};

const normalizeResult = (item) => {
    if (!item) return null;

    if (Array.isArray(item) && item.length >= 2 && typeof item[1] === 'object') {
        return normalizeResult(item[1]);
    }

    const obj = typeof item === 'object' ? item : { user_answer: item };

    const id = obj.id ?? obj.result_id ?? obj[0] ?? `${obj.test_id ?? obj.testId ?? Date.now()}`;
    const testId = obj.test_id ?? obj.testId ?? obj.testID ?? null;
    const userId = obj.user_id ?? obj.userId ?? obj.uid ?? null;
    const userAnswer = obj.user_answer ?? obj.answer ?? obj.response ?? '';
    const selectedIdx = obj.selected_option_index ?? obj.selectedOptionIndex ?? obj.selected ?? null;
    const isCorrect = parseIsCorrect(obj.is_correct ?? obj.correct ?? obj.passed ?? false);
    const createdAt = obj.created_at || obj.createdAt || obj.date || new Date().toISOString();
    const numericAnswer = typeof userAnswer === 'number' ? userAnswer : Number(userAnswer);
    const hasNumericAnswer = userAnswer !== '' && Number.isFinite(numericAnswer);
    const normalizedSelected = selectedIdx != null ? Number(selectedIdx) : null;
    const answerIndex = hasNumericAnswer ? numericAnswer : (Number.isFinite(normalizedSelected) ? normalizedSelected : null);
    const userAnswerDisplay = hasNumericAnswer ? String(numericAnswer) : (typeof userAnswer === 'string' ? userAnswer : JSON.stringify(userAnswer));

    return {
        id: String(id),
        testId: testId != null ? String(testId) : null,
        userId: userId != null ? String(userId) : null,
        userAnswer: userAnswerDisplay,
        selectedOptionIndex: answerIndex != null ? answerIndex : (Number.isFinite(normalizedSelected) ? normalizedSelected : null),
        answerIndex: answerIndex != null ? answerIndex : null,
        isCorrect,
        createdAt,
    };
};

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
};

const Results = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [testsById, setTestsById] = useState({});

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            if (!user || !user.id) {
                if (mounted) {
                    setResults([]);
                    setTestsById({});
                    setLoading(false);
                }
                return;
            }

            if (mounted) setLoading(true);

            try {
                const [resultsResponse, testsResponse] = await Promise.all([
                    axios.get(API_RESULTS_URL, { params: { user_id: user.id } }),
                    axios.get(API_TESTS_URL),
                ]);

                let rawResults = resultsResponse.data?.data ?? resultsResponse.data ?? [];
                const resultsArray = extractArray(rawResults);
                const normalizedResults = resultsArray
                    .map(normalizeResult)
                    .filter(Boolean)
                    .filter(r => !r.userId || r.userId === String(user.id));

                let rawTests = testsResponse.data?.data ?? testsResponse.data ?? [];
                const testsArray = extractArray(rawTests)
                    .map(normalizeTest)
                    .filter(Boolean);

                const map = {};
                testsArray.forEach(t => { map[String(t.id)] = t; });

                if (mounted) {
                    setResults(normalizedResults);
                    setTestsById(map);
                    
                    try {
                        const userKey = user?.id != null ? `completedTests_${user.id}` : 'completedTests_guest';
                        const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
                        const existSet = new Set(Array.isArray(existing) ? existing.map(String) : []);
                        normalizedResults.forEach(r => { if (r.isCorrect && r.testId) existSet.add(String(r.testId)); });
                        localStorage.setItem(userKey, JSON.stringify(Array.from(existSet)));
                        
                        try { window.dispatchEvent(new Event('completedTestsChanged')); } catch (e) { /* ignore */ }
                    } catch (e) { /* ignore localStorage errors */ }
                }
            } catch (err) {
                if (mounted) {
                    setResults([]);
                    setTestsById({});
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();

        return () => { mounted = false; };
    }, [user]);

    if (!user) {
        return (
            <div className="container results-page">
                <div className="card">
                    <div className="card-body">
                        <h1>Результаты тестов</h1>
                        <p>Авторизуйтесь, чтобы просматривать свои результаты.</p>
                        <Link to="/login" className="btn btn-primary">Войти</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container results-page">
        <div className="result-card">
            <h1>Ваши результаты по тестам</h1>

                    {loading ? (
                        <div className="results-loading">Загрузка результатов...</div>
                    ) : (
                        <div className="results-list">
                            {results.length === 0 ? (
                                <div>
                                    <p>Пока нет сохранённых результатов. Пройдите тест, чтобы увидеть статистику.</p>
                                    <Link to="/test" className="btn btn-primary">К списку тестов</Link>
                                </div>
                            ) : (
                                <ul className="list">
                                    {results.map(res => {
                                        const testInfo = res.testId ? testsById[String(res.testId)] : null;
                                        const testTitle = testInfo?.question ?? `Тест #${res.testId ?? '—'}`;
                                        const statusLabel = res.isCorrect ? 'Пройден' : 'Не пройден';
                                        const answerIndex = Number.isFinite(res.answerIndex) ? res.answerIndex : (Number.isFinite(res.selectedOptionIndex) ? res.selectedOptionIndex : null);
                                        const answerText = answerIndex != null && Array.isArray(testInfo?.options) && testInfo.options[answerIndex] !== undefined
                                            ? testInfo.options[answerIndex]
                                            : (res.userAnswer || '—');

                                        return (
                                            <li key={res.id} className="result-item">
                                                <div className="result-row">
                                                    <div className="result-main">
                                                        <div className="result-title">{testTitle}</div>
                                                                        <div className={`result-status ${res.isCorrect ? 'status-pass' : 'status-fail'}`}>{statusLabel}</div>
                                                        {Array.isArray(testInfo?.options) && testInfo.options.length > 0 ? (
                                                            <div className="result-options">
                                                                {testInfo.options.map((opt, i) => (
                                                                    <div key={i} className={`result-option ${Number(answerIndex) === i ? 'selected' : ''}`}>
                                                                        <span className="result-marker">{Number(answerIndex) === i ? '●' : '○'}</span>
                                                                        <span>{opt}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="result-meta">
                                                                <strong>Ваш ответ:</strong> {answerText}
                                                            </div>
                                                        )}
                                                                {answerIndex != null && (
                                                                    <div className="mt-4-small muted-small small-note">
                                                                        Номер варианта: {answerIndex + 1}
                                                                    </div>
                                                                )}
                                                        {res.testId && (
                                                            <div className="mt-8">
                                                                <Link to={`/tests/${res.testId}`} className="btn btn-sm btn-outline">Повторить тест</Link>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="result-date">
                                                        {formatDate(res.createdAt)}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>
    );
};

export default Results;
