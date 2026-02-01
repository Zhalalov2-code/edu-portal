import '../css/createNewsModal.css'
import { useState } from 'react';
import { useAuth } from '../utils/authContext';

const CreatedNewsCard = ({ isOpen, onClose, onSave }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const { user } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = () => {
        const formData = {
            text: text,
            files: file,
            id_user: user ? user.id : null,
            name_user: user ? user.name : 'Пользователь'
        };
        onSave(formData);
        setText('');
        setFile(null);
    }

    return (
        <div className="modal-overlay-news">
            <div className='modal-container-news'>
                <div className='modal-header-news'>
                    <button className='btnClose' onClick={onClose}>X</button>
                </div>
                <div className="modal-content-news">
                    <label className='label-news'>Добавить контент:</label>
                    <div className='btn-file'>
                        <input type="file" className='file-news' onChange={(e) => setFile(e.target.files[0])} />
                    </div>
                    <br />
                    <textarea className='text-direction' placeholder='Добавьте описание' value={text} onChange={(e) => setText(e.target.value)}></textarea>
                </div>
                <div className='modal-footer-news'>
                    <button className='btn btn-primary' onClick={handleSubmit}>Поделиться</button>
                </div>
            </div>
        </div>
    )
}

export default CreatedNewsCard;