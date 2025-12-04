import React, { useState } from 'react';
import '../../css/CreateLessonModal.css';

const CreateLessonModal = ({ courses = [], onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return alert('Введите название');
    if (!courseId) return alert('Выберите курс');
    onCreate({ title: title.trim(), content: content.trim(), course_id: courseId });
    setTitle('');
    setContent('');
    setCourseId('');
  };

  return (
    <div className="clm-overlay">
      <div className="clm-card">
        <div className="clm-header">
          <h3>Создать урок</h3>
          <button className="clm-close" onClick={onClose}>×</button>
        </div>
        <div className="clm-body">
          <div className="form-group">
            <label>Курс</label>
            <select value={courseId} onChange={e => setCourseId(e.target.value)} className="form-input">
              <option value="">-- Выберите курс --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Название</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="form-input" />
          </div>
          <div className="form-group">
            <label>Содержимое</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="form-input" rows={6} />
          </div>
        </div>
        <div className="clm-actions">
          <button className="btn btn-primary" onClick={handleCreate}>Создать</button>
          <button className="btn btn-outline" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default CreateLessonModal;
