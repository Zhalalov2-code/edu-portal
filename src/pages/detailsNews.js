import { useCallback, useEffect, useState } from 'react';
import '../css/DetailsNews.css';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import Spinner from '../components/Spinner';

const DetailsNews = () => {
    const { id } = useParams();
    const [news, setNews] = useState(null);
    const [comments, setComments] = useState([]);
    const [imageError, setImageError] = useState(false);
    const [responseReplys, setResponseReplys] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дн. назад`;
        }
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    const getNewsDetials = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL_BASE}/news/${id}`);
            if (response.status === 200) {
                let data = response.data?.data ?? response.data ?? null;

                if (Array.isArray(data)) {
                    let found = null;
                    for (const item of data) {
                        if (found) break;
                        if (Array.isArray(item)) {
                            for (const sub of item) {
                                if (sub && String(sub.id_news) === String(id)) { found = sub; break; }
                            }
                        } else if (item && typeof item === 'object') {
                            if (String(item.id_news) === String(id)) { found = item; break; }
                        }
                    }
                    if (!found) {
                        const firstObj = data.find(d => d && typeof d === 'object');
                        found = firstObj || null;
                    }
                    data = found;
                }
                setNews(data);
                console.log('Полученные детали новости:', data);
            }
        } catch (error) {
            console.error('Error fetching news details:', error);
            alert('Ошибка при загрузке новости. Пожалуйста, попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const getCommentsByNews = useCallback(async (newsId) => {
        try {
            const response = await axios.get(`${API_URL_BASE}/comments?id_news=${newsId}`);
            if (response.status === 200 || response.status === 201) {
                let data = response.data?.data ?? response.data ?? [];

                if (Array.isArray(data)) {
                    setComments(data);
                    return;
                }

                const values = Object.values(data || {});
                const list = values.find(v => Array.isArray(v)) || values;
                setComments(Array.isArray(list) ? list : []);
            }
        } catch (error) {
            console.error('[getCommentsByNews] error', error);
        }
    }, []);

    const getReplys = useCallback(async (id_comment) => {
        try {
            const response = await axios.get(`${API_URL_BASE}/comments?parent_id=${id_comment}`);
            if (response.status === 200 || response.status === 201) {
                let all_replies = [];
                if (Array.isArray(response.data)) {
                    all_replies = response.data;
                } else if (response.data.data) {
                    all_replies = response.data.data;
                } else {
                    const value = Object.values(response.data);
                    if (Array.isArray(value[0])) {
                        all_replies = value[0];
                    } else {
                        all_replies = value;
                    }
                }
                setResponseReplys(prev => ({
                    ...prev,
                    [id_comment]: all_replies
                }));
            }
        } catch (error) {
            console.error('Error fetching replies by comment:', error);
        }
    }, []);

    useEffect(() => {
        getNewsDetials();
    }, [getNewsDetials]);

    useEffect(() => {
        if (news?.id_news) {
            getCommentsByNews(news.id_news);
        }
    }, [news, getCommentsByNews]);

    useEffect(() => {
        if (!comments.length) return;
        comments.forEach(comment => {
            if (comment.id_comment) {
                getReplys(comment.id_comment);
            }
        });
    }, [comments, getReplys]);

    useEffect(() => {
        Object.keys(responseReplys).forEach(parent_id => {
            const replies = responseReplys[parent_id];
            if (Array.isArray(replies)) {
                replies.forEach(reply => {
                    if (reply.id_comment) {
                        getReplys(reply.id_comment);
                    }
                });
            }
        });
    }, [responseReplys, getReplys]);

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    return (
        <div className='details-news'>
            <header className='details-news__header'>
                <button className='details-news__back' onClick={() => window.history.back()}>
                    ← Назад
                </button>
            </header>

            <section className='details-news__hero'>
                <h1 className='details-news__title'>
                   Подробнее о новости
                </h1>
                <div className='details-news__meta'>
                    <div className='details-news__author'>
                        <span className='details-news__avatar'>
                            {news?.name_user ? news.name_user.charAt(0).toUpperCase() : '?'}
                        </span>
                        <span>{news?.name_user || 'Пользователь'}</span>
                    </div>
                    <span>{formatDate(news?.created_at)}</span>
                </div>
            </section>

            <div className='details-news__content'>
                <div>
                    <div className='details-news__media'>
                        {news?.files && !imageError ? (
                            <img
                                className='details-news__image'
                                src={`${API_URL_BASE}/uploads/${news.files}`}
                                alt={news?.text || 'Детальная новость'}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className='details-news__image details-news__image--placeholder'>Нет изображения</div>
                        )}
                    </div>

                    <div className='details-news__body'>
                        <p><b>Категория:</b> {news?.parent_name || 'Без категории'}, {news?.child_name || 'Без подкатегории'}</p>
                        <p><b>Описание:</b> {news?.text || 'Описание отсутствует.'}</p>
                    </div>
                </div>

                <aside className='details-news__sidebar'>
                    <div className='details-news__comments-preview'>
                        <div className='details-news__comments-preview-title'>Последние комментарии</div>
                        {comments.length === 0 ? (
                            <div className='details-news__empty'>Комментариев пока нет</div>
                        ) : (
                            comments.slice(0, 3).map((comment, index) => (
                                <div className='details-news__comment' key={comment.id_comment || index}>
                                    <span className='details-news__avatar'>
                                        {comment.name_sender ? comment.name_sender.charAt(0).toUpperCase() : 'П'}
                                    </span>
                                    <div className='details-news__comment-body'>
                                        <div className='details-news__comment-row'>
                                            <span className='details-news__comment-author'>
                                                {comment.name_sender || 'Пользователь'}
                                            </span>
                                            <span className='details-news__comment-date'>
                                                {formatDate(comment.created_at)}
                                            </span>
                                        </div>
                                        <div className='details-news__comment-text'>
                                            {comment.text || comment.comment}
                                        </div>
                                        {responseReplys[comment.id_comment]?.length > 0 && (
                                            <div className='details-news__replies'>
                                                {responseReplys[comment.id_comment].map((reply, replyIndex) => (
                                                    <div className='details-news__reply' key={reply.id_comment || replyIndex}>
                                                        <span className='details-news__reply-name'>
                                                            {reply.name_sender || 'Пользователь'}:
                                                        </span>
                                                        <span className='details-news__reply-text'>
                                                            {reply.text}
                                                        </span>
                                                        <span className='details-news__reply-date'>
                                                            {formatDate(reply.created_at)}
                                                        </span>
                                                        {responseReplys[reply.id_comment]?.length > 0 && (
                                                            <div className='details-news__nested-replies'>
                                                                {responseReplys[reply.id_comment].map((nestedReply, nestedIndex) => (
                                                                    <div className='details-news__reply' key={nestedReply.id_comment || nestedIndex}>
                                                                        <span className='details-news__reply-name'>
                                                                            {nestedReply.name_sender || 'Пользователь'}:
                                                                        </span>
                                                                        <span className='details-news__reply-text'>
                                                                            {nestedReply.text}
                                                                        </span>
                                                                        <span className='details-news__reply-date'>
                                                                            {formatDate(nestedReply.created_at)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DetailsNews;