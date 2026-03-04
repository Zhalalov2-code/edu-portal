import '../css/news.css'
import NewsCard from '../components/newsCard';
import CreatedNewsCard from '../components/createdNewsCard';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import Spinner from '../components/Spinner';
import CreateCategoryModal from '../components/createdCategory';
import { useAuth } from "../utils/authContext.js";
import CategoryList from '../components/cotegoryList';

const News = () => {
    const [newsList, setNewsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [categoryList, setCategoryList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isOpenNewsCard, setIsOpenNewsCard] = useState(false);
    const [isOpenCategoryCard, setIsOpenCategoryCard] = useState(false);
    const [isOpenEditCategoryCard, setIsOpenEditCategoryCard] = useState(false);
    const [isOpenListCategories, setIsOpenListCategories] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const { user } = useAuth();

    
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

            setIsOpenNewsCard(false);
            getNews(selectedCategory);
        } catch (error) {
            alert('Ошибка при отправке. Попробуйте еще раз.')
        }
    }

    const handleCreateCategory = async (categoryData) => {
        try{
            const params = new URLSearchParams();
            params.append('name_category', categoryData.name_category);
            params.append('slug_category', categoryData.slug_category);
            if (categoryData.parent_id) {
                params.append('parent_id', categoryData.parent_id);
            }
            
            const response = await axios.post(`${API_URL_BASE}/categories`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || response.data.message || 'Не удалось создать категорию');
                return;
            }

            alert('Категория успешно создана');
            setIsOpenCategoryCard(false);
            getCategory();
            getNews(selectedCategory);
        } catch (error) {
            alert('Ошибка при создании категории. Попробуйте еще раз.');
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

    const handleDeleteCategory = async (id_category) => {
        console.log('🗑️ Попытка удаления категории с ID:', id_category);
        
        if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
            return;
        }

        try {
            const response = await axios.delete(`${API_URL_BASE}/categories/${id_category}`);
            
            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                console.error('❌ Ошибка удаления:', response.data.error || response.data.message);
                alert(response.data.error || response.data.message || 'Не удалось удалить категорию');
                return;
            }

            alert('Категория успешно удалена');
            getCategory();
            getNews(selectedCategory);
        } catch (error) {
            console.error('❌ Ошибка при удалении категории:', error.response?.data || error.message);
            alert('Ошибка при удалении категории. Попробуйте еще раз.');
        }
    }

    const handleEditCategory = async (category) => {
        setIsOpenListCategories(false);
        setEditingCategory(category);
        setIsOpenEditCategoryCard(true);
    }

    const handleUpdateCategory = async (categoryData) => {
        if (!editingCategory) {
            console.error('❌ Нет категории для редактирования');
            return;
        }

        try {
            const params = new URLSearchParams();
            params.append('id_category', editingCategory.id_category);
            params.append('name_category', categoryData.name_category);
            params.append('slug_category', categoryData.slug_category);
            if (categoryData.parent_id) {
                params.append('parent_id', categoryData.parent_id);
            }

            const response = await axios.put(`${API_URL_BASE}/categories/${editingCategory.id_category}`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                console.error('❌ Ошибка обновления:', response.data.error);
                alert(response.data.error || response.data.message || 'Не удалось обновить категорию');
                return;
            }

            alert('Категория успешно обновлена');
            setIsOpenEditCategoryCard(false);
            setEditingCategory(null);
            getCategory();
            getNews(selectedCategory);
        } catch (error) {
            console.error('❌ Ошибка при обновлении категории:', error);
            alert('Ошибка при обновлении категории. Попробуйте еще раз.');
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
                <button className='btn btn-primary' onClick={() => setIsOpenNewsCard(true)}>Поделиться контентом +</button>
                {
                    (user?.role === 'Admin' || user?.role === 'admin') && (
                        <>
                            <button className='btn btn-secondary' onClick={() => setIsOpenCategoryCard(true)}>Создать категорию +</button>
                            <button className='btn btn-primary' onClick={() => setIsOpenListCategories(!isOpenListCategories)}>
                                {isOpenListCategories ? 'Скрыть категории' : 'Список категории'}
                            </button>
                        </>
                    )
                }
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
                isOpen={isOpenNewsCard}
                onClose={() => setIsOpenNewsCard(false)}
                onSave={handlePostsNews}
            />
            <CreateCategoryModal
                isOpen={isOpenCategoryCard}
                onClose={() => setIsOpenCategoryCard(false)}
                onCreate={handleCreateCategory}
                categories={categoryList}
            />
            <CreateCategoryModal
                isOpen={isOpenEditCategoryCard}
                onClose={() => {
                    setIsOpenEditCategoryCard(false);
                    setEditingCategory(null);
                }}
                onCreate={handleUpdateCategory}
                categories={categoryList}
                isEditMode={true}
                editingCategory={editingCategory}
            />
            {isOpenListCategories && (
                <CategoryList
                    isOpen={isOpenListCategories}
                    onClose={() => setIsOpenListCategories(false)}
                    categories={categoryList}
                    onCategorySelect={(category) => {
                        filterByCategory(category.id_category);
                        setIsOpenListCategories(false);
                    }}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                />
            )}
        </div>
    )
}

export default News;