import '../css/createNewsModal.css'
import { useEffect, useState } from 'react';
import { useAuth } from '../utils/authContext';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';

const CreatedNewsCard = ({ isOpen, onClose, onSave }) => {
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [selectedPath, setSelectedPath] = useState([]);

    const getCategories = async () => {
        try {
            const response = await axios.get(`${API_URL_BASE}/categories`);
            if (response.status === 200 || response.status === 201) {
                let categoriesArray = [];
                if (Array.isArray(response.data)) {
                    categoriesArray = response.data;
                } else if (response.data && Array.isArray(response.data.data)) {
                    categoriesArray = response.data.data;
                } else if (response.data && Array.isArray(response.data.categories)) {
                    categoriesArray = response.data.categories;
                }
                setCategories(categoriesArray);
            } else {
                console.error('Ошибка при получении категорий:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Ошибка при получении категорий:', error);
            return [];
        }
    };

    useEffect(() => {
        getCategories();
    }, []);

    const rootCategories = categories.filter(
        (cat) => cat.parent_id === '' || cat.parent_id === null || typeof cat.parent_id === 'undefined'
    );

    const getChildCategories = (parentCategoryId) =>
        categories.filter((cat) => Number(cat.parent_id) === Number(parentCategoryId));

    const categoryLevels = [rootCategories];

    selectedPath.forEach((selectedId) => {
        const children = getChildCategories(selectedId);
        if (children.length > 0) {
            categoryLevels.push(children);
        }
    });

    const handleCategoryLevelChange = (levelIndex, value) => {
        if (!value) {
            setSelectedPath((prev) => prev.slice(0, levelIndex));
            return;
        }

        const selectedId = Number(value);
        setSelectedPath((prev) => [...prev.slice(0, levelIndex), selectedId]);
    };

    const selectedCategoryId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1] : '';

    if (!isOpen) return null;

    const handleSubmit = () => {
        const formData = {
            text: text,
            files: file,
            id_user: user ? user.id : null,
            name_user: user ? user.name : 'Пользователь',
            id_category: selectedCategoryId
        };
        onSave(formData);
        setText('');
        setFile(null);
        setSelectedPath([]);
    }


    return (
        <div className="modal-overlay-news">
            <div className='modal-container-news'>
                <div className='modal-header-news'>
                    <button className='btnClose' onClick={onClose}>X</button>
                </div>
                <div className="modal-content-news">
                    <label className='label-news'><b>Добавить контент</b></label>
                    {categoryLevels.map((levelOptions, levelIndex) => (
                        levelOptions.length > 0 && (
                            <div key={levelIndex}>
                                <label className='label-news'>
                                    {levelIndex === 0 ? 'Выберите категорию: ' : `Выберите подкатегорию (уровень ${levelIndex + 1}): `}
                                </label>
                                <select
                                    className='select-category'
                                    value={selectedPath[levelIndex] ?? ''}
                                    onChange={(e) => handleCategoryLevelChange(levelIndex, e.target.value)}
                                >
                                    <option value=''>-- Выберите категорию --</option>
                                    {levelOptions.map((category) => (
                                        <option key={category.id_category} value={category.id_category}>
                                            {category.name_category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )
                    ))}
                    <div>
                        <label className='label-news'>Прикрепить файл: </label>
                        <div className='btn-file'>
                            <input type="file" className='file-news' onChange={(e) => setFile(e.target.files[0])} />
                        </div>
                    </div>
                    <br />
                    <textarea className='text-direction' placeholder='Добавьте описание' value={text} onChange={(e) => setText(e.target.value)}></textarea>
                </div>
                <div className='modal-footer-news'>
                    <button className='btn btn-primary' onClick={handleSubmit}>Поделиться</button>
                </div>
            </div>
        </div >
    )
}

export default CreatedNewsCard;