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
    const [selectedParentCategory, setSelectedParentCategory] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

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

    const parentCategories = categories.filter(cat => !cat.parent_id || cat.parent_id === '' || cat.parent_id === null);

    const childCategories = selectedParentCategory 
        ? categories.filter(cat => cat.parent_id === parseInt(selectedParentCategory))
        : [];

    const handleParentCategoryChange = (e) => {
        setSelectedParentCategory(e.target.value);
        setSelectedCategory('');
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        const formData = {
            text: text,
            files: file,
            id_user: user ? user.id : null,
            name_user: user ? user.name : 'Пользователь',
            id_category: selectedCategory
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
                    <label className='label-news'><b>Добавить контент</b></label>
                    <div>
                        <label className='label-news'>Выберите родительскую категорию: </label>
                        <select className='select-category' value={selectedParentCategory} onChange={handleParentCategoryChange}>
                            <option value=''>-- Выберите категорию --</option>
                            {parentCategories.map((category) => (
                                <option key={category.id_category} value={category.id_category}>
                                    {category.name_category}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedParentCategory && childCategories.length > 0 && (
                        <div>
                            <label className='label-news'>Выберите подкатегорию: </label>
                            <select className='select-category' value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value=''>-- Выберите подкатегорию --</option>
                                {childCategories.map((category) => (
                                    <option key={category.id_category} value={category.id_category}>
                                        {category.name_category}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
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