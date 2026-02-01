import '../css/createNewsModal.css'
import { useEffect, useState } from 'react';

const EditNewsModal = ({ isOpen, onClose, onSave, newsData }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        if (newsData) {
            setText(newsData.text || '');
            setFile(null);
        }
    }, [newsData]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        const formData = {
            id_news: newsData.id_news,
            text: text,
            files: file,
        };
        onSave(formData);
        setText('');
        setFile(null);
    }

    return (
        <div className="modal-overlay-news">
            <div className='modal-container-news'>
                <div className='modal-header-news'>
                    <h3>Редактировать новость</h3>
                    <button className='btnClose' onClick={onClose}>X</button>
                </div>
                <div className="modal-content-news">
                    <label className='label-news'>Изменить контент:</label>
                    <div className='btn-file'>
                        <input type="file" className='file-news' onChange={(e) => setFile(e.target.files[0])} />
                    </div>
                    {newsData?.files && !file && (
                        <div className='current-image-info'>
                            <p>Текущее изображение: {newsData.files}</p>
                        </div>
                    )}
                    <br />
                    <textarea 
                        className='text-direction' 
                        placeholder='Добавьте описание' 
                        value={text} 
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                </div>
                <div className='modal-footer-news'>
                    <button className='btn btn-secondary' onClick={onClose}>Отмена</button>
                    <button className='btn btn-primary' onClick={handleSubmit}>Сохранить</button>
                </div>
            </div>
        </div>
    )
}

export default EditNewsModal;
