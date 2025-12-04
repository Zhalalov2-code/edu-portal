import { useState, useEffect } from 'react';
import '../../css/CreateTestModal.css';

const CreateTestModal = ({ lessons = [], onClose, onCreate }) => {
  const [lessonId, setLessonId] = useState(lessons.length ? lessons[0].id : '');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [correctIndex, setCorrectIndex] = useState(null);

  const handleOptionChange = (idx, value) => {
    setOptions(prev => prev.map((o, i) => i === idx ? value : o));
  };

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (idx) => setOptions(prev => prev.filter((_, i) => i !== idx));

  const handleCreate = () => {
    if (!lessonId) return alert('Выберите урок');
    if (!question.trim()) return alert('Введите вопрос');
    const filled = options.map(o => (o || '').trim()).filter(o => o);
    if (filled.length < 2) return alert('Добавьте минимум 2 варианта ответа');
    if (correctIndex === null || correctIndex < 0 || correctIndex >= options.length) return alert('Выберите правильный ответ');

    const payload = {
      lesson_id: lessonId,
      question: question.trim(),
      options: options.map(o => o.trim()),
      correct_answer: correctIndex,
    };
    onCreate(payload);
    setLessonId(lessons.length ? lessons[0].id : '');
    setQuestion('');
    setOptions(['', '']);
    setCorrectIndex(null);
  };

  // Если lessons приходят асинхронно, установим первый lessonId по умолчанию
  useEffect(() => {
    if ((!lessonId || lessonId === '') && Array.isArray(lessons) && lessons.length) {
      setLessonId(String(lessons[0].id));
    }
  }, [lessons, lessonId]);

  return (
    <div className="ctm-overlay">
      <div className="ctm-card">
        <div className="ctm-header">
          <h3>Создать тест</h3>
          <button className="ctm-close" onClick={onClose}>×</button>
        </div>
        <div className="ctm-body">
          <div className="form-group">
            <label>Урок</label>
            <select className="form-input" value={lessonId} onChange={e => setLessonId(e.target.value)}>
              <option value="">-- выберите урок --</option>
              {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Вопрос</label>
            <input value={question} onChange={e => setQuestion(e.target.value)} className="form-input" />
          </div>

          <div className="form-group">
            <label>Варианты ответов</label>
            {options.map((opt, idx) => (
              <div key={idx} className="ctm-option-row">
                <input
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  className="form-input"
                  placeholder={`Вариант ${idx + 1}`}
                />
                <label className="ctm-option-label">
                  <input type="radio" name="correct" checked={correctIndex === idx} onChange={() => setCorrectIndex(idx)} /> Правильный
                </label>
                {options.length > 2 && (
                  <button className="btn btn-outline" onClick={() => removeOption(idx)}>Удалить</button>
                )}
              </div>
            ))}
            <div>
              <button className="btn btn-sm btn-outline" onClick={addOption}>Добавить вариант</button>
            </div>
          </div>
        </div>
        <div className="ctm-actions">
          <button className="btn btn-primary" onClick={handleCreate}>Создать</button>
          <button className="btn btn-outline" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTestModal;
