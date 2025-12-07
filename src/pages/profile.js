import { useAuth } from "../utils/authContext.js";
import "../css/profile.css";
import { useState } from "react";
import ModalEditProfile from "../components/profile/modalEditProfile";
import axios from "axios";

function Profile() {
    const { user, isLoading } = useAuth();
    const [isOpenModal, setIsOpenModal] = useState(false);
    const { setUser } = useAuth();

    const handleOpenModal = () => {
        setIsOpenModal(true);
    }

    const handleCloseModal = () => {
        setIsOpenModal(false);
    }

    const handleSave = async (formData) => {
        try {
            const formDataToSend = new FormData();

            formDataToSend.append('id', user.id);
            formDataToSend.append('name', formData.name || '');
            formDataToSend.append('email', formData.email || '');

            if (formData.avatar instanceof File) {
                formDataToSend.append('avatar', formData.avatar);
            }
            if (formData.avatar2 instanceof File) {
                formDataToSend.append('avatar2', formData.avatar2);
            }
            if (formData.avatar3 instanceof File) {
                formDataToSend.append('avatar3', formData.avatar3);
            }
            if (formData.avatar4 instanceof File) {
                formDataToSend.append('avatar4', formData.avatar4);
            }
            if (formData.avatar5 instanceof File) {
                formDataToSend.append('avatar5', formData.avatar5);
            }

            const res = await axios({
                method: 'POST',
                url: 'https://zhalalov2.su/backend-school/update',
                data: formDataToSend,
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            setIsOpenModal(false);
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (err) {
        }
    }

    if (isLoading) {
        return <div>Загрузка...</div>
    }
    if (!user) {
        return <div>Пожалуйста, войдите в систему, чтобы просмотреть ваш профиль.</div>
    }

    return (<div className="profile-container">
        <h1 className="profile-title">Профиль пользователя</h1>
        <div className="user-avatar-profile">
            <img src={`https://zhalalov2.su/backend-school/uploads/${user.avatar}`} alt="Avatar" className="user-avatar" />
        </div>
        <button className="edit-profile-button" onClick={handleOpenModal}>Редактировать профиль</button>
        <div className="profile-info">
            <p><b>Имя:</b> {user.name}</p>
            <p><b>Электронная почта:</b> {user.email}</p>
            <p><b>Роль:</b> {user.role}</p>
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