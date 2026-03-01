import { useState } from 'react';
import '../css/createCategoryModal.css';

const CreateCategoryModal = ({ isOpen, onClose, onCreate, categories = [] }) => {
  const [nameCategory, setNameCategory] = useState('');
  const [slugCategory, setSlugCategory] = useState('');
  const [parentId, setParentId] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!nameCategory.trim()) {
      alert('Введите название категории');
      return;
    }
    if (!slugCategory.trim()) {
      alert('Введите слаг категории');
      return;
    }

    const parentIdValue = parentId ? parseInt(parentId, 10) : null;

    const categoryData = {
      name_category: nameCategory.trim(),
      slug_category: slugCategory.trim(),
      parent_id: parentIdValue
    };
    
    onCreate(categoryData);

    setNameCategory('');
    setSlugCategory('');
    setParentId('');
  };

  return (
    <div className="category-modal-overlay">
      <div className="category-modal-card">
        <div className="category-modal-header">
          <h3>Создать категорию</h3>
          <button className="category-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="category-modal-body">
          <div className="form-group">
            <label>Название категории</label>
            <input
              type="text"
              value={nameCategory}
              onChange={(e) => setNameCategory(e.target.value)}
              className="form-input"
              placeholder="Введите название"
            />
          </div>

          <div className="form-group">
            <label>Слаг категории</label>
            <input
              type="text"
              value={slugCategory}
              onChange={(e) => setSlugCategory(e.target.value)}
              className="form-input"
              placeholder="Введите слаг (например: web-development)"
            />
          </div>

          <div className="form-group">
            <label>Родительская категория</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="form-input"
            >
              <option value="">-- Нет родительской категории --</option>
              {categories.map((cat) => (
                <option key={cat.id_category} value={cat.id_category}>
                  {cat.name_category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="category-modal-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            Создать
          </button>
          <button className="btn btn-outline" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;