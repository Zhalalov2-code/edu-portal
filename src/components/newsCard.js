import axios from 'axios';
import '../css/newsCard.css'
import { API_URL_BASE } from '../utils/API_URL_CONF';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../utils/authContext';
import EditNewsModal from './editNewsModal';
import { Link } from 'react-router-dom';

const NewsCard = ({ newsList = [], deleteNews, getNews }) => {
    const { user } = useAuth();
    const [commentTextByNews, setCommentTextByNews] = useState({});
    const [commentsByNews, setCommentsByNews] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openCommentDropdown, setOpenCommentDropdown] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeReply, setActiveReply] = useState(null);
    const [replyText, setReplyText] = useState({});
    const [responseReplys, setResponseReplys] = useState({});
    const [activeShowReplies, setActiveShowReplies] = useState(null);
    const [openReplyDropdown, setOpenReplyDropdown] = useState(null);

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
        } else {
            return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' });
        }
    };

    const getComments = useCallback(async (id_news) => {
        try {
            const response = await axios.get(`${API_URL_BASE}/comments?id_news=${id_news}`);
            if (response.status === 200 || response.status === 201) {
                let all_comments = [];
                if (Array.isArray(response.data)) {
                    all_comments = response.data;
                } else if (response.data.data) {
                    all_comments = response.data.data;
                } else {
                    const value = Object.values(response.data);
                    if (Array.isArray(value[0])) {
                        all_comments = value[0];
                    } else {
                        all_comments = value;
                    }
                }
                setCommentsByNews(prev => ({
                    ...prev,
                    [id_news]: all_comments
                }));
            } else {
                alert('Ошибка при получении комментариевs');
            }
        } catch (error) {
            alert('Ошибка при получении комментариев. Попробуйте еще раз.')
        }
    }, []);

    const getReplys = useCallback(async (id_comment) => {
        try {
            const response = await axios.get(`${API_URL_BASE}/replies_to_comments?id_comment=${id_comment}`);
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
            } else {
                alert('Ошибка при получении ответов на комментарии');
                return [];
            }
        } catch (error) {
            alert('Ошибка при получении ответов на комментарии. Попробуйте еще раз.')
            return [];
        }
    }, []);

    useEffect(() => {
        if (!newsList.length) return;
        newsList.forEach(item => {
            if (item.id_news) {
                getComments(item.id_news);
            }
        });
    }, [newsList, getComments]);

    useEffect(() => {
        Object.keys(commentsByNews).forEach(id_news => {
            const comments = commentsByNews[id_news];
            if (Array.isArray(comments)) {
                comments.forEach(comment => {
                    if (comment.id_comment) {
                        getReplys(comment.id_comment);
                    }
                });
            }
        });
    }, [commentsByNews, getReplys])

    if (!newsList.length) {
        return (
            <div className='news-empty'>Новостей пока нет</div>
        )
    }

    const sendComment = async (form_data) => {
        try {
            let body = new URLSearchParams();

            body.append('text', commentTextByNews[form_data.id_news] || '');
            body.append('id_user', user ? user.id : null);
            body.append('id_news', form_data.id_news);
            body.append('name_sender', user ? user.name : 'Пользователь');

            const response = await axios({
                method: 'post',
                url: `${API_URL_BASE}/comments`,
                data: body,
            })
            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось отправить комментарий');
                return;
            }
            setCommentTextByNews(prev => ({
                ...prev,
                [form_data.id_news]: ''
            }));
            getComments(form_data.id_news);
        } catch (error) {
            console.error('Error sending comment:', error);
            alert('Ошибка при отправке комментария. Попробуйте еще раз.')
        }
    }

    const sendReply = async (id_comment, id_news) => {
        try {
            const text = replyText[id_comment] || '';

            if (!text.trim()) {
                alert('Введите текст ответа');
                return;
            }

            let body = new URLSearchParams();
            body.append('text', text);
            body.append('user_id', user ? user.id : null);
            body.append('id_comment', id_comment);
            body.append('user_name', user ? user.name : 'Пользователь');

            const response = await axios({
                method: 'post',
                url: `${API_URL_BASE}/replies_to_comments`,
                data: body,
            });

            console.log('sendReply response:', response?.data);

            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось отправить ответ');
                return;
            }

            setReplyText(prev => ({
                ...prev,
                [id_comment]: ''
            }));
            setActiveReply(null);
            getComments(id_news);
        } catch (error) {
            console.error('Error sending reply:', error);
            alert('Ошибка при отправке ответа. Попробуйте еще раз.');
        }
    }

    const deleteComment = async (id_comment, id_news) => {
        try {
            const response = await axios.delete(`${API_URL_BASE}/comments?id_comment=${id_comment}`);
            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось удалить комментарий');
                return;
            }
            alert('Комментарий успешно удален');
            getComments(id_news);
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Ошибка при удалении комментария. Попробуйте еще раз.')
        }
    }

    const deleteReply = async (id_reply, id_cpmment) => {
        try{
            const response = await axios.delete(`${API_URL_BASE}/replies_to_comments?id_reply=${id_reply}`);
            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось удалить ответ');
                return;
            }
            alert('Ответ успешно удален');
            getReplys(id_cpmment);
        } catch (error) {
            console.error('Error deleting reply:', error);
            alert('Ошибка при удалении ответа. Попробуйте еще раз.')
        }
    }

    const handleOpenEditModal = (newsItem) => {
        if (newsItem.id_user !== user?.id) {
            alert('Вы можете редактировать только свой контент.');
            return;
        }
        setSelectedNews(newsItem);
        setIsEditModalOpen(true);
        setOpenDropdown(null);
    }

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedNews(null);
    }

    const handleUpdateNews = async (formData) => {
        try {
            let data, headers = {};

            if (formData.files instanceof File) {
                data = new FormData();
                data.append('id_news', formData.id_news);
                data.append('text', formData.text || '');
                data.append('files', formData.files);
                headers['Content-Type'] = 'multipart/form-data';
            } else {
                const params = new URLSearchParams();
                params.append('id_news', formData.id_news);
                params.append('text', formData.text || '');
                data = params;
            }

            const response = await axios({
                method: 'POST',
                url: `${API_URL_BASE}/news/${formData.id_news}`,
                data: data,
                headers: headers
            });

            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось обновить новость');
                return;
            }
            handleCloseEditModal();
            getNews();
            alert('Новость успешно обновлена');
        } catch (error) {
            console.error('Error updating news:', error);
            alert('Ошибка при обновлении новости. Попробуйте еще раз.');
        }
    }

    return (
        <div className='news-feed'>
            {newsList.map((item, index) => {
                const imageUrl = item.files ? `${API_URL_BASE}/uploads/${item.files}` : null;
                const comments = commentsByNews[item.id_news] || [];
                const commentText = commentTextByNews[item.id_news] || '';
                return (
                    <div key={item.id_news || `news-${index}`}>
                        <div className='news-feed-header'>
                            <div className='news-feed-user-info'>
                                <div className='news-feed-avatar'>
                                    <span>{item.name_user ? item.name_user.charAt(0).toUpperCase() : '?'}</span>
                                </div>
                                <div className='news-feed-username'>
                                    <span className='username'>{item.name_user || item.id_user || '?'}</span>
                                    <span className='post-date'>{formatDate(item.created_at)}</span>
                                </div>
                            </div>
                            {item.id_user === user?.id && (
                                <div className='dropdown-delete-news'>
                                    <button
                                        className='news-feed-options'
                                        onClick={() => setOpenDropdown(openDropdown === item.id_news ? null : item.id_news)}
                                    >
                                        ⋯
                                    </button>
                                    {openDropdown === item.id_news && (
                                        <ul className='dropdown-menu-delete-news show'>
                                            <li>
                                                <button
                                                    className='dropdown-item-delete-news'
                                                    onClick={() => {
                                                        deleteNews(item.id_news);
                                                        setOpenDropdown(null);
                                                    }}
                                                >
                                                    Удалить контент
                                                </button>
                                            </li>
                                            <li>
                                                <button
                                                    className='dropdown-item-delete-news'
                                                    onClick={() => handleOpenEditModal(item)}
                                                >
                                                    Редактировать контент
                                                </button>
                                            </li>
                                            <li>
                                                <Link to={`/detailsNews/${item.id_news}`} className='dropdown-item-delete-news' onClick={() => setOpenDropdown(null)}>
                                                    Подробнее о новости
                                                </Link>
                                            </li>
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                        <article className='news-feed-item'>
                            <div className='news-feed-left'>

                                <div className='news-feed-media'>
                                    {imageUrl ? (
                                        <img className='news-feed-image' src={imageUrl} alt={item.text || 'Новость'} />
                                    ) : (
                                        <div className='news-feed-placeholder'>Нет изображения</div>
                                    )}
                                </div>
                            </div>

                            <div className='news-feed-right'>
                                <div className='news-feed-body'>
                                    <div className='news-feed-caption'>
                                        <span className='caption-username'>Описание: </span>
                                        <span className='caption-text'>{item.text || 'Без описания'}</span>
                                    </div>
                                </div>
                            </div>
                        </article>
                        <div className='news-feed-comments-section'>
                            <div className='comments-header'>
                                <h4>Комментарии</h4>
                            </div>
                            <div className='comments-list'>
                                {comments.length === 0 ? (
                                    <p className='no-comments'>Комментариев пока нет</p>
                                ) : (
                                    comments.map((comment, commentIndex) => (
                                        <div className='comment-item' key={comment.id_comment || commentIndex}>
                                            <div className='comment-content'>
                                                <span className='comment-author'>{comment.name_sender || 'Пользователь'} <span className='comment-date'>{formatDate(comment.created_at)}.</span></span>
                                                <span className='comment-text'>{comment.text || comment.comment}</span>
                                                {(responseReplys[comment.id_comment] && responseReplys[comment.id_comment].length > 0) && (
                                                    <>
                                                        {activeShowReplies !== comment.id_comment ? (
                                                            <span
                                                                className='comment-reply'
                                                                onClick={() => setActiveShowReplies(comment.id_comment)}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                Ответы ({responseReplys[comment.id_comment].length})
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <div className='replies-container'>
                                                                    {responseReplys[comment.id_comment].map((reply, replyIndex) => (
                                                                        <div className='reply-item' key={reply.id_reply || replyIndex}>
                                                                            <div className='reply-content'>
                                                                                <span className='reply-author'>{reply.user_name || 'Пользователь'} <span className='reply-date'>{formatDate(reply.created_at)}.</span></span>
                                                                                <span className='reply-text'>{reply.text}</span>
                                                                            </div>
                                                                            <div className='dropdown-delete-reply'>
                                                                                <button
                                                                                    className='reply-options'
                                                                                    onClick={() => setOpenReplyDropdown(openReplyDropdown === reply.id_reply ? null : reply.id_reply)}
                                                                                >
                                                                                    ⋯
                                                                                </button>
                                                                                {openReplyDropdown === reply.id_reply && (
                                                                                    <ul className='dropdown-menu-delete-reply show'>
                                                                                        <li>
                                                                                            <button
                                                                                                className='dropdown-item-delete-reply'
                                                                                                onClick={() => {
                                                                                                    deleteReply(reply.id_reply, comment.id_comment);
                                                                                                    setOpenReplyDropdown(null);
                                                                                                }}
                                                                                            >
                                                                                                Удалить
                                                                                            </button>
                                                                                        </li>
                                                                                    </ul>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <span
                                                                    className='comment-reply'
                                                                    onClick={() => setActiveShowReplies(null)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    Скрыть ответы
                                                                </span>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {activeReply !== comment.id_comment ? (
                                                    <span
                                                        className='comment-reply'
                                                        onClick={() => setActiveReply(comment.id_comment)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        Ответить на комментарий
                                                    </span>
                                                ) : (
                                                    <div className='reply-input-container'>
                                                        <input
                                                            type='text'
                                                            placeholder='Ваш ответ...'
                                                            className='comment-input-field'
                                                            value={replyText[comment.id_comment] || ''}
                                                            onChange={(e) => setReplyText(prev => ({
                                                                ...prev,
                                                                [comment.id_comment]: e.target.value
                                                            }))}
                                                            autoFocus
                                                        />
                                                        <button
                                                            className='comment-submit-btn'
                                                            onClick={() => sendReply(comment.id_comment, item.id_news)}
                                                        >
                                                            Отправить
                                                        </button>
                                                        <button
                                                            className='comment-cancel-btn'
                                                            onClick={() => {
                                                                setActiveReply(null);
                                                                setReplyText(prev => ({
                                                                    ...prev,
                                                                    [comment.id_comment]: ''
                                                                }));
                                                            }}
                                                        >
                                                            Отмена
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className='dropdown-delete-comment'>
                                                <button
                                                    className='comment-options'
                                                    onClick={() => setOpenCommentDropdown(openCommentDropdown === comment.id_comment ? null : comment.id_comment)}
                                                >
                                                    ⋯
                                                </button>
                                                {openCommentDropdown === comment.id_comment && (
                                                    <ul className='dropdown-menu-delete-comment show'>
                                                        <li>
                                                            <button
                                                                className='dropdown-item-delete-comment'
                                                                onClick={() => {
                                                                    deleteComment(comment.id_comment, item.id_news);
                                                                    setOpenCommentDropdown(null);
                                                                }}
                                                            >
                                                                Удалить
                                                            </button>
                                                        </li>
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className='comments-input'>
                                <input
                                    type='text'
                                    placeholder='Добавить комментарий...'
                                    className='comment-input-field'
                                    value={commentText}
                                    onChange={(e) => setCommentTextByNews(prev => ({
                                        ...prev,
                                        [item.id_news]: e.target.value
                                    }))}
                                />
                                <button
                                    className='comment-submit-btn'
                                    onClick={() => sendComment({
                                        id_news: item.id_news,
                                    })}
                                >
                                    Отправить
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
            <EditNewsModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleUpdateNews}
                newsData={selectedNews}
            />
        </div>
    )
}

export default NewsCard