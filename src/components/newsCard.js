import axios from 'axios';
import '../css/newsCard.css'
import { API_URL_BASE } from '../utils/API_URL_CONF';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../utils/authContext';
import EditNewsModal from './editNewsModal';

const NewsCard = ({ newsList = [], deleteNews, getNews }) => {
    const { user } = useAuth();
    const [commentTextByNews, setCommentTextByNews] = useState({});
    const [commentsByNews, setCommentsByNews] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [openCommentDropdown, setOpenCommentDropdown] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);

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
                console.log('Comments for news', id_news, all_comments);
            } else {
                alert('Ошибка при получении комментариевs');
            }
        } catch (error) {
            alert('Ошибка при получении комментариев. Попробуйте еще раз.')
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
                                    <span className='post-date'>{item.created_at}</span>
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
                                                <span className='comment-author'>{comment.name_sender || 'Пользователь'}:</span>
                                                <span className='comment-text'>{comment.text || comment.comment}</span>
                                                <span className='comment-date'>{comment.created_at}</span>
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