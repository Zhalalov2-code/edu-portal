import { useState } from 'react';
import '../../css/Course.css';
import '../../css/CreateCourseModal.css';

const CreateCourseModal = ({ isOpen, onClose, onCreate, teacherId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Название курса обязательно');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({ title: title.trim(), description: description.trim(), teacher_id: teacherId });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err?.message || 'Ошибка при создании курса');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>Создать курс</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label className="form-label">Название</label>
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название курса"
            required
          />

          <label className="form-label">Описание</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание курса"
            rows={6}
          />

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Создание...' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCourseModal;
