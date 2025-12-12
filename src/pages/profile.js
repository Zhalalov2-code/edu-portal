import { useAuth } from "../utils/authContext.js";
import "../css/profile.css";
import { useState } from "react";
import ModalEditProfile from "../components/profile/modalEditProfile";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../utils/firebaseConfig.js";

function Profile() {
    const { user, setUser } = useAuth();
    const [isOpenModal, setIsOpenModal] = useState(false);
    const navigate = useNavigate();

    const handleOpenModal = () => {
        setIsOpenModal(true);
    }

    const handleCloseModal = () => {
        setIsOpenModal(false);
    }

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
                url: 'https://zhalalov2.su/school/update',
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
                const deleteResponse = await axios.delete(`https://zhalalov2.su/school/users/${user.id}`);
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

    return (<div className="profile-container">
        <h1 className="profile-title">Профиль пользователя</h1>
        <div className="foto-section">
            <div className="user-avatar-profile">
                {user.avatar ? (
                    <img src={`https://zhalalov2.su/school/uploads/${user.avatar}`} alt="Avatar" className="user-avatar" />
                ) : (
                    <div className="user-avatar-placeholder">
                        {user.name ? user.name.substring(0, 2).toUpperCase() : '?'}
                    </div>
                )}
            </div>
            <button className="edit-profile-button" onClick={handleOpenModal}>Редактировать профиль</button>
        </div>
        <div className="profile-info">
            <p><b>Имя:</b> {user.name || 'Не указано'}</p>
            <p><b>Электронная почта:</b> {user.email || 'Не указано'}</p>
            <p><b>Роль:</b> {user.role || 'Не указано'}</p>
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
    </div>)
}

export default Profile;