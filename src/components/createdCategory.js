import { useState, useEffect } from 'react';
import '../css/createCategoryModal.css';

const CreateCategoryModal = ({ isOpen, onClose, onCreate, categories = [], isEditMode = false, editingCategory = null }) => {
  const [nameCategory, setNameCategory] = useState('');
  const [slugCategory, setSlugCategory] = useState('');
  const [parentId, setParentId] = useState('');
  const [selectedChildCategory, setSelectedChildCategory] = useState('');

  useEffect(() => {
    if (isEditMode && editingCategory) {
      setNameCategory(editingCategory.name_category || '');
      setSlugCategory(editingCategory.slug_category || '');
      setParentId(editingCategory.parent_id || '');
    } else {
      setNameCategory('');
      setSlugCategory('');
      setParentId('');
    }
  }, [isOpen, isEditMode, editingCategory]);

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

    const parentIdValue = selectedChildCategory
      ? parseInt(selectedChildCategory, 10)
      : parentId
        ? parseInt(parentId, 10)
        : null;

    const categoryData = {
      name_category: nameCategory.trim(),
      slug_category: slugCategory.trim(),
      parent_id: parentIdValue
    };

    onCreate(categoryData);

    setNameCategory('');
    setSlugCategory('');
    setParentId('');
    setSelectedChildCategory('');
  };

  const parentCategories = categories.filter(cat => !cat.parent_id || cat.parent_id === '' || cat.parent_id === null);
  const childCategories = parentId
    ? categories.filter(cat => Number(cat.parent_id) === Number(parentId))
    : [];

  return (
    <div className="category-modal-overlay">
      <div className="category-modal-card">
        <div className="category-modal-header">
          <h3>{isEditMode ? 'Редактировать категорию' : 'Создать категорию'}</h3>
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
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value, 10) : '';
                setParentId(value);
                setSelectedChildCategory('');
              }}
              className="form-input"
            >
              <option value="">-- Нет родительской категории --</option>
              {parentCategories.map((cat) => (
                <option key={cat.id_category} value={cat.id_category}>
                  {cat.name_category}
                </option>
              ))}
            </select>
          </div>

          {parentId && childCategories.length > 0 && (
            <div className="form-group">  
              <label>Подкатегории</label>
              <select
                value={selectedChildCategory}
                onChange={(e) => setSelectedChildCategory(e.target.value)}
                className="form-input"
              >
                <option value="">-- Выберите подкатегорию --</option>
                {childCategories.map((cat) => (
                  <option key={cat.id_category} value={cat.id_category}>
                    {cat.name_category}
                  </option>
                ))}
              </select>
            </div>
          )}

        </div>

        <div className="category-modal-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            {isEditMode ? 'Обновить' : 'Создать'}
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