import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import CreateTestModal from '../components/Test/CreateTestModal';
import axios from 'axios';
import { useAuth } from '../utils/authContext';
import { ensureArrayOptions } from '../utils/options';
import '../css/Test.css';

const RESPONSE_ARRAY_KEYS = ['data', 'tests', 'items', 'results', 'rows', 'list'];

const tryParseJson = (value) => {
    if (typeof value !== 'string') {
        return { parsed: value, parsedFromJson: false };
    }
    const trimmed = value.trim();
    if (trimmed === '') {
        return { parsed: [], parsedFromJson: true };
    }
    try {
        return { parsed: JSON.parse(trimmed), parsedFromJson: true };
    } catch (err) {
        return { parsed: value, parsedFromJson: false };
    }
};

const looksLikeTest = (value) => {
    if (!value || typeof value !== 'object') return false;
    return ['id', 'test_id', 'testId', 'question', 'title', 'name'].some(key => Object.prototype.hasOwnProperty.call(value, key));
};

const extractArrayPayload = (payload) => {
    const visited = new Set();

    const helper = (value, depth = 0) => {
        if (value == null || depth > 10) return [];

        const { parsed, parsedFromJson } = tryParseJson(value);

        if (Array.isArray(parsed)) {
            return parsed;
        }

        if (parsed && typeof parsed === 'object') {
            if (visited.has(parsed)) return [];
            visited.add(parsed);

            for (const key of RESPONSE_ARRAY_KEYS) {
                if (parsed[key] != null) {
                    const arr = helper(parsed[key], depth + 1);
                    if (Array.isArray(arr) && arr.length) return arr;
                }
            }

            const values = Object.values(parsed);
            if (values.length) {
                for (const val of values) {
                    const arr = helper(val, depth + 1);
                    if (Array.isArray(arr) && arr.length) return arr;
                }

                const objectEntries = values
                    .map(val => tryParseJson(val).parsed ?? val)
                    .filter(entry => entry && typeof entry === 'object' && looksLikeTest(entry));
                if (objectEntries.length) {
                    return objectEntries;
                }
            }

            if (looksLikeTest(parsed)) {
                return [parsed];
            }

            return [];
        }

        if (parsedFromJson) {
            return helper(parsed, depth + 1);
        }

        return [];
    };

    const extracted = helper(payload);
    if (Array.isArray(extracted)) return extracted;
    return [];
};

const resolveCorrectAnswerIndex = (rawValue, options) => {
    if (rawValue == null) return null;
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue;

    if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if (trimmed === '') return null;
        const numeric = Number(trimmed);
        if (!Number.isNaN(numeric)) return numeric;

        if (Array.isArray(options)) {
            const exactIdx = options.findIndex(opt => opt === trimmed);
            if (exactIdx !== -1) return exactIdx;

            const lowerTrimmed = trimmed.toLowerCase();
            const caseInsensitiveIdx = options.findIndex(opt => typeof opt === 'string' && opt.toLowerCase() === lowerTrimmed);
            if (caseInsensitiveIdx !== -1) return caseInsensitiveIdx;
        }
    }

    return null;
};

const normalizeBackendTest = (entry) => {
    if (entry == null) return null;

    if (typeof entry === 'string') {
        const trimmed = entry.trim();
        if (trimmed === '') return null;
        const { parsed, parsedFromJson } = tryParseJson(entry);
        if (!parsedFromJson) return null;
        return normalizeBackendTest(parsed);
    }

    if (Array.isArray(entry)) {
        for (const val of entry) {
            const normalized = normalizeBackendTest(val);
            if (normalized) return normalized;
        }
        return null;
    }

    if (typeof entry !== 'object') return null;

    const parsedObject = entry;
    const id = parsedObject.id ?? parsedObject.test_id ?? parsedObject.testId ?? parsedObject[0] ?? null;
    if (id == null) return null;

    const lessonId = parsedObject.lesson_id ?? parsedObject.lessonId ?? parsedObject.lesson ?? null;
    const question = parsedObject.question ?? parsedObject.title ?? parsedObject.name ?? `Тест #${id}`;
    const rawOptions = parsedObject.options ?? parsedObject.opts ?? parsedObject.answers ?? parsedObject.variants ?? [];
    const options = ensureArrayOptions(rawOptions);
    const correctRaw = parsedObject.correct_answer ?? parsedObject.correctAnswer ?? parsedObject.correct ?? parsedObject.answer ?? parsedObject.right_answer ?? null;
    const correctIndex = resolveCorrectAnswerIndex(correctRaw, options);
    const createdAt = parsedObject.createdAt || parsedObject.created_at || parsedObject.created || parsedObject.date || new Date().toISOString();

    return {
        id: String(id),
        lesson_id: lessonId != null ? String(lessonId) : null,
        question,
        options,
        correct_answer: Number.isFinite(correctIndex) ? correctIndex : null,
        createdAt,
    };
};

const Test = () => {
    const [tests, setTests] = useState([]);
    const [completedTests, setCompletedTests] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const API_TESTS_URL = 'https://zhalalov2.su/backend-school/tests';
    const API_LESSONS_URL = 'https://zhalalov2.su/backend-school/lessons';
    const API_LESSON_PROGRESS_URL = 'https://zhalalov2.su/backend-school/lesson_progress';
    const [lessons, setLessons] = useState([]);
    const { user } = useAuth();
    const userId = user?.id != null ? String(user.id) : null;
    const completedStorageKey = userId ? `completedTests_${userId}` : 'completedTests_guest';
    const [completedLessons, setCompletedLessons] = useState(new Set());

    const handleCreate = async (payload) => {
        try {
            const body = new URLSearchParams();
            body.append('lesson_id', payload.lesson_id);
            body.append('question', payload.question);
            body.append('options', JSON.stringify(payload.options || []));
            body.append('correct_answer', String(payload.correct_answer));

            const res = await axios.post(API_TESTS_URL, body.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000,
            });

            const data = res.data?.data || res.data || {};

            let parsedOptions = payload.options || [];
            const serverOptions = data?.options;
            if (typeof serverOptions === 'string') {
                try { parsedOptions = JSON.parse(serverOptions); } catch (e) { parsedOptions = [String(serverOptions)]; }
            } else if (Array.isArray(serverOptions)) {
                parsedOptions = serverOptions;
            }

            const normalizedOptions = ensureArrayOptions(parsedOptions);

            const toShow = {
                id: Number(data?.id) || Date.now(),
                lesson_id: data?.lesson_id ?? payload.lesson_id,
                question: data?.question ?? payload.question,
                options: normalizedOptions,
                correct_answer: data?.correct_answer ?? payload.correct_answer,
                createdAt: data?.created_at || data?.createdAt || new Date().toISOString(),
            };

            setTests(prev => [toShow, ...prev]);
            setIsAdding(false);
        } catch (err) {
            alert('Ошибка при сохранении теста');
            setIsAdding(false);
        }
    };

    const getLessons = async () => {
        try {
            const response = await axios.get(API_LESSONS_URL);
            if (response.status === 200) {
                const arr_lessons = extractArrayPayload(response.data);
                const normalized = arr_lessons.map(item => {
                    const lessonEntry = tryParseJson(item).parsed ?? item;
                    if (Array.isArray(item) && item.length >= 2) {
                        const maybeObj = item[1];
                        const parsedObj = tryParseJson(maybeObj).parsed ?? maybeObj;
                        return {
                            id: parsedObj?.id ?? parsedObj?.lesson_id ?? item[0],
                            title: parsedObj?.title ?? parsedObj?.name ?? String(item[0])
                        };
                    }
                    if (lessonEntry && typeof lessonEntry === 'object') {
                        return {
                            id: lessonEntry.id ?? lessonEntry.lesson_id ?? lessonEntry[0] ?? null,
                            title: lessonEntry.title ?? lessonEntry.name ?? lessonEntry.lesson_title ?? JSON.stringify(lessonEntry)
                        };
                    }
                    return { id: lessonEntry, title: String(lessonEntry) };
                }).filter(x => x && x.id !== undefined && x.id !== null);
                setLessons(normalized);
            }
        } catch (err) {
            setLessons([]);
        }
    };

    useEffect(() => {
        const getTests = async () => {
            try {
                const response = await axios.get(API_TESTS_URL);
                if (response.status === 200) {
                    const arr_tests = extractArrayPayload(response.data);
                    const normalized = [];
                    arr_tests.forEach(item => {
                        const parsed = normalizeBackendTest(item);
                        if (parsed && parsed.id != null) {
                            normalized.push(parsed);
                        }
                    });
                    setTests(normalized);
                }
            } catch (err) {
                setTests([]);
            }
        };

        getTests();
    }, [API_TESTS_URL]);

    const fetchLessonProgress = useCallback(async () => {
        if (!userId) {
            setCompletedLessons(new Set());
            return;
        }
        try {
            const response = await axios.get(API_LESSON_PROGRESS_URL, { params: { user_id: userId }, timeout: 15000 });
            const values = extractArrayPayload(response.data);
            const completedCollected = new Set();
            values.forEach(item => {
                const parsed = tryParseJson(item).parsed ?? item;
                const source = Array.isArray(parsed) && parsed.length >= 2 && typeof parsed[1] === 'object' ? parsed[1] : parsed;
                const entry = tryParseJson(source).parsed ?? source;
                if (!entry) return;
                const lessonId = entry.lesson_id ?? entry.lessonId ?? null;
                if (lessonId == null) return;
                const strId = String(lessonId);
                const statusValue = (entry.status || '').toString().toLowerCase();
                const percentValue = Number(entry.progress_percent ?? entry.progress_precent ?? entry.progress ?? 0);
                if (statusValue === 'completed' || percentValue >= 100) {
                    completedCollected.add(strId);
                }
            });
            setCompletedLessons(completedCollected);
        } catch (err) {
            setCompletedLessons(new Set());
        }
    }, [API_LESSON_PROGRESS_URL, userId]);
    useEffect(() => {
        fetchLessonProgress();
    }, [fetchLessonProgress]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const syncCompleted = () => {
            try {
                const stored = JSON.parse(localStorage.getItem(completedStorageKey) || '[]');
                if (Array.isArray(stored)) {
                    setCompletedTests(Array.from(new Set(stored.map(String))));
                }
            } catch (err) {
                // ignore
            }
        };

        const handleStorage = (event) => {
            if (!event || !event.key || event.key === completedStorageKey) {
                syncCompleted();
            }
            if (event && event.key === 'lesson_progress_changed') {
                try {
                    getLessons();
                    fetchLessonProgress();
                } catch (e) {
                    // ignore
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', syncCompleted);
        const handleCompletedTestsChanged = () => {
            syncCompleted();
        };
        window.addEventListener('completedTestsChanged', handleCompletedTestsChanged);

        syncCompleted();

        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', syncCompleted);
            window.removeEventListener('completedTestsChanged', handleCompletedTestsChanged);
        };
    }, [completedStorageKey, fetchLessonProgress]);

    const completedTestsSet = useMemo(() => new Set(completedTests.map(String)), [completedTests]);

    return (
        <div className="container test-page">
            <div className="card">
                <div className="card-body">
                    <h1>Тесты</h1>

                    <div className="test-actions">
                        {user && user.role === 'Teacher' && (
                            <button className="btn btn-primary" onClick={() => setIsAdding(true)}>Добавить тест</button>
                        )}
                    </div>

                    <div className="test-list-section">
                        <h3>Список тестов</h3>
                        {tests.length === 0 ? (
                            <p>Пока нет тестов.</p>
                        ) : (
                            <ul className="list">
                                {tests.map(t => {
                                    const lessonTitle = lessons.find(s => String(s.id) === String(t.lesson_id))?.title || t.lesson_id;
                                    const isCompleted = completedTestsSet.has(String(t.id));
                                    let canTake = false;
                                    if (user && user.role === 'Teacher') {
                                        canTake = true;
                                    } else {
                                        if (!t.lesson_id) {
                                            canTake = true;
                                        } else {
                                            const lid = String(t.lesson_id);
                                            // allow taking the test only if lesson is completed (status 'completed' or progress>=100)
                                            canTake = completedLessons.has(lid);
                                        }
                                    }

                                    return (
                                        <li key={t.id} className="test-item">
                                            <div className="test-item-row">
                                                <div>
                                                    <div className="test-question">Вопрос: {t.question}</div>
                                                    <div className="test-lesson">Привязано к уроку: {lessonTitle}</div>
                                                    <div className="test-options">
                                                        {t.options && t.options.map((opt, i) => (
                                                            <div key={i} className="test-option">
                                                                <input type="radio" checked={t.correct_answer === i} readOnly />
                                                                <span>{opt}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="test-option-wrap">
                                                        {canTake ? (
                                                            <Link to={`/tests/${t.id}`} className="btn btn-sm btn-primary">
                                                                {isCompleted ? 'Повторить тест' : 'Пройти тест'}
                                                            </Link>
                                                        ) : (
                                                            <button className="btn btn-sm btn-outline" disabled>
                                                                Требуется завершить урок
                                                            </button>
                                                        )}

                                                    </div>
                                                    {isCompleted && (
                                                        <div className="test-completed-badge">Тест сдан</div>
                                                    )}
                                                </div>
                                                <div className="test-created">{new Date(t.createdAt).toLocaleString()}</div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
            {isAdding && (
                <CreateTestModal lessons={lessons} onClose={() => setIsAdding(false)} onCreate={handleCreate} />
            )}
        </div>
    );
};

export default Test;
