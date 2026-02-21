import '../css/news.css'
import NewsCard from '../components/newsCard';
import CreatedNewsCard from '../components/createdNewsCard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import Spinner from '../components/Spinner';

const News = () => {
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [newsList, setNewsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryList, setCategoryList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    const handleOpenModal = () => {
        setIsOpenModal(true)
    }

    const handleCloseModal = () => {
        setIsOpenModal(false)
    }

    const getNews = async (categoryId) => {
        setIsLoading(true);
        try {
            const url = categoryId ? `${API_URL_BASE}/news?id_category=${categoryId}` : `${API_URL_BASE}/news`;
            const response = await axios.get(url);
            if (response.status === 200 || response.status === 201) {
                if (typeof response.data === 'string') {
                    const text = response.data.trim();
                    if (text.startsWith('<') || text.includes('Fatal error') || text.includes('Warning')) {
                        alert('Ошибка сервера! Проверьте:\n1. Существует ли таблица "news" в БД\n2. Логи PHP в консоли');
                        return;
                    }
                }

                let all_news = [];
                if (Array.isArray(response.data)) {
                    all_news = response.data[2] || [];
                } else if (response.data && response.data.data) {
                    all_news = response.data.data;
                } else if (response.data && typeof response.data === 'object') {
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
                } else {
                    all_news = [];
                }
                setNewsList(all_news);
            } else {
                alert('Ошибка при получении новостей');
            }
        } catch (error) {
            alert('Ошибка при получении новостей, срабатывает catch. Попробуйте еще раз.')
        } finally {
            setIsLoading(false);
        }
    }

    const getCategory = async () => {
        try {
            const response = await axios.get(`${API_URL_BASE}/categories`);
            if (response.status === 200 || response.status === 201) {
                let all_category = [];
                if (Array.isArray(response.data)) {
                    all_category = response.data[2] || [];
                } else if (response.data && response.data.data) {
                    all_category = response.data.data;
                } else if (response.data && typeof response.data === 'object') {
                    const value = Object.values(response.data);
                    if (Array.isArray(value[2])) {
                        all_category = value[2];
                    } else if (Array.isArray(value[1])) {
                        all_category = value[1];
                    } else if (Array.isArray(value[0])) {
                        all_category = value[0];
                    } else {
                        all_category = value;
                    }
                } else {
                    all_category = [];
                }
                setCategoryList(all_category);
            }
        } catch (error) {
            alert('Ошибка при получении категорий. Попробуйте еще раз.')
        }
    }

    useEffect(() => {
        getNews();
        getCategory();
    }, []);

    const handlePostsNews = async (formData) => {
        try {
            const data = new FormData();
            data.append('text', formData.text || '');
            data.append('id_user', formData.id_user || '');
            data.append('name_user', formData.name_user || 'Пользователь');
            data.append('id_category', formData.id_category || '');

            if (formData.files instanceof File) {
                data.append('files', formData.files);
            }

            const response = await axios({
                method: 'POST',
                url: `${API_URL_BASE}/news`,
                data: data
            })

            if (typeof response.data === 'string') {
                if (response.data.includes('Fatal error') || response.data.includes('Warning')) {
                    alert('Ошибка сервера!\n\nОтвет: ' + response.data.substring(0, 300));
                    return;
                }
            }

            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось поделиться контентом');
                return;
            }

            setIsOpenModal(false)
            getNews(selectedCategory);
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
            getNews(selectedCategory);
        } catch (error) {
            alert('Ошибка при удалении новости. Попробуйте еще раз.')
        }
    }

    const filterByCategory = (categoryId) => {
        setSelectedCategory(categoryId);
        getNews(categoryId);
    }

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    return (
        <div className='news-container'>
            <div className="header-news">
                <h1>Лента новостей:</h1>
                <button className='btn btn-primary' onClick={handleOpenModal}>Поделиться контентом +</button>
            </div>
            <div className='filter-section-news'>
                <select className='filter-category-news' value={selectedCategory} onChange={(e) => filterByCategory(e.target.value)}>
                    <option value="">Все категории</option>
                    {categoryList.map((category) => (
                        <option key={category.id_category} value={category.id_category}>
                            {category.name_category}
                        </option>
                    ))}
                </select>
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