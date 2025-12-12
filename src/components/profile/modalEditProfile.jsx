import { useState } from 'react';
import '../../css/modalEditProfile.css';

function ModalEditProfile({ isOpen, onClose, userData, onSave }) {
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        avatar: userData?.avatar || '',
    });

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'file' ? e.target.files[0] : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Редактировать профиль</h2>
                    <button className="modal-close" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="name">Имя</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Введите имя"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio">Фото профиля</label>
                        <input
                            type="file"
                            id="avatar"
                            name="avatar"
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn-save">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalEditProfile;