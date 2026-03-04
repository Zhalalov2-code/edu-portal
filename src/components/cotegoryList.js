import '../css/categoryList.css'

const CategoryList = ({ isOpen, onClose, categories, onCategorySelect, onEdit, onDelete }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay-category">
            <div className="modal-container-category">
                <div className="modal-header-category">
                    <h2>Управление категориями</h2>
                    <button className="btnClose" onClick={onClose}>✕</button>
                </div>
                <div className="modal-content-category">
                    <div className="category-list">
                        {categories.length === 0 ? (
                            <p className="empty-message">Категории не найдены</p>
                        ) : (
                            categories.map(category => (
                                <div 
                                    key={category.id_category}
                                    className="category-item"
                                >
                                    <div className="category-info" onClick={() => onCategorySelect(category)}>
                                        <span className="category-name">{category.name_category}</span>
                                    </div>
                                    <div className="category-actions">
                                        <button 
                                            className="btn btn-edit"
                                            onClick={() => onEdit(category)}
                                            title="Редактировать"
                                        >
                                            ✏️ Редактировать
                                        </button>
                                        <button 
                                            className="btn btn-delete"
                                            onClick={() => onDelete(category.id_category)}
                                            title="Удалить"
                                        >
                                            🗑️ Удалить
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="modal-footer-category">
                    <button className="btn btn-secondary" onClick={onClose}>Закрыть</button>
                </div>
            </div>
        </div>
    )
}

export default CategoryList;