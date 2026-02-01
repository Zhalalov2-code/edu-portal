import '../css/news.css'
import NewsCard from '../components/newsCard';
import CreatedNewsCard from '../components/createdNewsCard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';

const News = () => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [newsList, setNewsList] = useState([]);

    const handleOpenModal = () => {
        setIsOpenModal(true)
    }

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    const getNews = async () => {
        try {
            const response = await axios.get(`${API_URL_BASE}/news`);
            if (response.status === 200 || response.status === 201) {
                let all_news = [];
                if (Array.isArray(response.data)) {
                    all_news = response.data[2] || [];
                } else if (response.data.data) {
                    all_news = response.data.data;
                } else {
                    const value = Object.values(response.data);
                    if (Array.isArray(value[2])) {
                        all_news = value[2];
                    } else if (Array.isArray(value[1])) {
                        all_news = value[1];
                    } else if (Array.isArray(value[0])) {
                        all_news = value[0];
                    } else {
                        all_news = value;
                    }
                }
                setNewsList(all_news);
            } else {
                alert('Ошибка при получении новостей');
            }
        } catch (error) {
            alert('Ошибка при получении новостей, срабатывает catch. Попробуйте еще раз.')
        }
    }

    useEffect(() => {
        getNews();
    }, []);

    const handlePostsNews = async (formData) => {
        try {
            let data, headers = {}

            if (formData.files instanceof File) {
                data = new FormData();
                data.append('text', formData.text || '');
                data.append('files', formData.files);
                data.append('id_user', formData.id_user || null);
                data.append('name_user', formData.name_user || 'Пользователь');
                headers['Content-Type'] = 'multipart/form-data'
            } else {
                const params = new URLSearchParams();
                params.append('text', formData.text || '');
                params.append('id_user', formData.id_user || null);
                params.append('name_user', formData.name_user || 'Пользователь');
                data = params;
            }

            const response = await axios({
                method: 'POST',
                url: `${API_URL_BASE}/news`,
                data: data,
                headers: headers
            })

            if (typeof response.data === 'string') {
                if (response.data.includes('Fatal error') || response.data.includes('Warning')) {
                    alert('Ошибка сервера! Проверьте:\n1. Существует ли таблица "news" в БД\n2. Логи PHP в консоли');
                    return;
                }
            }

            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось поделиться контентом');
                return;
            }

            setIsOpenModal(false)
            getNews();
        } catch (error) {
            alert('Ошибка при отправке. Попробуйте еще раз.')
        }
    }

    const deleteNews = async (id_news) => {
        try {
            const response = await axios.delete(`${API_URL_BASE}/news?id_news=${id_news}`);
            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось удалить новость');
                return;
            }
            alert('Новость успешно удалена');
            getNews();
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Ошибка при удалении новости. Попробуйте еще раз.')
        }
    }

    return (
        <div className='news-container'>
            <div className="header-news">
                <h1>Лента новостей:</h1>
                <button className='btn btn-primary' onClick={handleOpenModal}>Поделиться контентом +</button>
            </div>
            <div className="content-news">
                <NewsCard
                    newsList={newsList}
                    deleteNews={deleteNews}
                    getNews={getNews}
                />
            </div>
            <div className="footer-news">

            </div>
            <CreatedNewsCard
                isOpen={isOpenModal}
                onClose={handleCloseModal}
                onSave={handlePostsNews}
            />
        </div>
    )
}

export default News;