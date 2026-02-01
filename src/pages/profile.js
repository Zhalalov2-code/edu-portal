import { useAuth } from "../utils/authContext.js";
import "../css/profile.css";
import { useCallback, useEffect, useState } from "react";
import ModalEditProfile from "../components/profile/modalEditProfile";
import NewsCard from "../components/newsCard";
import axios from "axios";
import { API_URL_BASE } from "../utils/API_URL_CONF.js";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/firebaseConfig.js";

function Profile() {
    const { user, setUser } = useAuth();
    const [isOpenModal, setIsOpenModal] = useState(false);
    const [userNews, setUserNews] = useState([]);
    const navigate = useNavigate();

    const handleOpenModal = () => {
        setIsOpenModal(true);
    }

    const handleCloseModal = () => {
        setIsOpenModal(false);
    }

    const getNewsUser = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL_BASE}/news?id_user=${user.id}`);
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
                console.log('Новости пользователя:', all_news);
                return all_news;
            } else {
                alert('Ошибка при получении новостей пользователя');
                return [];
            }
        } catch (error) {
            alert('Ошибка при получении новостей пользователя, срабатывает catch. Попробуйте еще раз.');
            return [];
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            getNewsUser().then(news => setUserNews(news));
        }
    }, [user, getNewsUser])

    const handleSave = async (formData) => {
        try {
            let data, headers = {};

            if (formData.avatar instanceof File) {
                data = new FormData();
                data.append('id', user.id);
                data.append('name', formData.name || '');
                data.append('avatar', formData.avatar);
                headers['Content-Type'] = 'multipart/form-data';
            } else {
                const params = new URLSearchParams();
                params.append('id', user.id);
                params.append('name', formData.name || '');
                data = params;
            }

            const res = await axios({
                method: 'POST',
                url: `${API_URL_BASE}/update`,
                data: data,
                headers: headers
            })

            if (res.data.status && res.data.status !== 200) {
                alert(res.data.error || 'Ошибка при обновлении профиля');
                return;
            }

            setIsOpenModal(false);
            const updatedUser = {
                ...user,
                name: formData.name || user.name,
                avatar: res.data.user?.avatar || user.avatar,
                provider: 'backend'
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('Профиль успешно обновлён');
        } catch (err) {
            console.error('Ошибка при обновлении профиля:', err);
            alert('Ошибка при обновлении профиля');
        }
    }

    const deleteNews = async (id_news) => {
        try {
            const response = await axios.delete(`${API_URL_BASE}/news/${id_news}`);
            if (!response.data.status || (response.data.status !== 201 && response.data.status !== 200)) {
                alert(response.data.error || 'Не удалось удалить новость');
                return;
            }
            alert('Новость успешно удалена');
            setUserNews(prev => prev.filter(news => news.id_news !== id_news));
        } catch (error) {
            console.error('Error deleting news:', error);
            alert('Ошибка при удалении новости. Попробуйте еще раз.');
        }
    }

    const handleDeleteUser = async () => {
        if (window.confirm('Вы уверены, что хотите удалить свой профиль? Это действие необратимо.')) {
            try {
                console.log('Текущий пользователь:', user);
                console.log('Firebase currentUser:', auth.currentUser);

                if (!user.id) {
                    alert('Не удалось определить пользователя для удаления');
                    return;
                }

                console.log('Отправка DELETE запроса на бэкенд для user.id:', user.id);
                const deleteResponse = await axios.delete(`${API_URL_BASE}/users/${user.id}`);
                console.log('Ответ от бэкенда:', deleteResponse.status, deleteResponse.data);

                const firebaseUser = auth.currentUser;
                console.log('Firebase user перед удалением:', firebaseUser?.uid, firebaseUser?.email);

                if (firebaseUser) {
                    console.log('Попытка удалить Firebase пользователя');
                    await firebaseUser.delete();
                    console.log('Firebase пользователь успешно удалён');
                }

                localStorage.removeItem('user');
                setUser(null);
                alert('Профиль успешно удалён');
                navigate('/login');
            } catch (err) {
                console.error('Полная ошибка:', err);
                console.error('Код ошибки:', err.code);
                console.error('Сообщение:', err.message);

                if (err.code === 'auth/requires-recent-login') {
                    alert('Для удаления аккаунта требуется повторный вход. Пожалуйста, войдите снова и попробуйте удалить аккаунт.');
                    navigate('/login');
                } else {
                    console.error('Ошибка при удалении профиля:', err);
                    alert('Ошибка при удалении профиля');
                }
            }
        }
    }

    if (!user) {
        return <div>Пожалуйста, войдите в систему, чтобы просмотреть ваш профиль.</div>
    }

    return (
        <div>
            <div className="profile-header">
                <div className="foto-section">
                    <div className="user-avatar-profile">
                        {user.avatar ? (
                            <img src={`${API_URL_BASE}/uploads/${user.avatar}`} alt="Avatar" className="user-avatar" />
                        ) : (
                            <div className="user-avatar-placeholder">
                                {user.name ? user.name.substring(0, 2).toUpperCase() : '?'}
                            </div>
                        )}
                    </div>
                    <button className="edit-profile-button" onClick={handleOpenModal}>Редактировать профиль</button>
                </div>
                <div className="profile-container">
                    <h1 className="profile-title">Профиль пользователя</h1>
                    <div className="profile-info">
                        <p><b>Имя:</b> {user.name || 'Не указано'}</p>
                        <p><b>Электронная почта:</b> {user.email || 'Не указано'}</p>
                        <p><b>Роль:</b> {user.role || 'Не указано'}</p>
                    </div>
                </div>
            </div>
            <div className="delete-profile-section">
                <button className="delete-profile-button" onClick={handleDeleteUser}>Удалить аккаунт</button>
            </div>
            <ModalEditProfile
                isOpen={isOpenModal}
                onClose={handleCloseModal}
                userData={user}
                onSave={handleSave}
            />
            <div className="profile-news-section">
                <h2 className="profile-news-title">Мои контенты</h2>
                {userNews && userNews.length > 0 ? (
                    <NewsCard newsList={userNews} deleteNews={deleteNews} getNews={() => getNewsUser().then(news => setUserNews(news))} />
                ) : (
                    <div className="profile-news-empty">
                        <p>У вас пока нет новостей. Перейдите на страницу новостей, чтобы создать свою первую новость!</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Profile;