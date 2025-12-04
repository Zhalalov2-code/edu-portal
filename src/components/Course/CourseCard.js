import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../../css/Course.css';
import '../../css/CourseCard.css';

const CourseCard = ({ course, user, onEnroll }) => {
  const {
    id,
    title,
    description,
    teacher_name,
    lessons_count,
    created_at,
    progress = 0,
    enrolled: enrolledProp = false,
    students_count: students_count_prop = 0,
  } = course;

  const [enrolled, setEnrolled] = useState(Boolean(enrolledProp));
  const [students_count, setStudentsCount] = useState(students_count_prop || 0);

  useEffect(() => {
    setEnrolled(Boolean(enrolledProp));
  }, [enrolledProp]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleEnroll = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof onEnroll === 'function') {
      onEnroll(id);
      setEnrolled(true);
      setStudentsCount(prev => prev + 1);
      return;
    }
  };

  return (
    <div className="course-card">
      <div className="course-card-header">
        <div className="course-badge">
          {enrolled ? (
            <span className="badge badge-success">Записан</span>
          ) : (
            <span className="badge badge-primary">Доступен</span>
          )}
        </div>
        
        {enrolled && progress > 0 && (
          <div className="course-progress">
            <div className="progress-bar">
              <div className={`progress-fill w-${Math.max(0, Math.min(100, Math.round(progress / 5) * 5))}`} />
            </div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
      </div>

      <div className="course-card-body">
        <h3 className="course-title">
          <Link to={`/courses/${id}`}>
            {title}
          </Link>
        </h3>
        
        <p className="course-description">
          {description}
        </p>

        <div className="course-meta">
          <div className="course-teacher">
            <svg className="course-meta-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>{teacher_name}</span>
          </div>
          
          <div className="course-lessons">
            <svg className="course-meta-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{lessons_count} уроков</span>
          </div>
          
          <div className="course-students">
            <svg className="course-meta-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            <span>{students_count} студентов</span>
          </div>
        </div>

        <div className="course-date">
          <svg className="course-meta-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>Создан {formatDate(created_at)}</span>
        </div>
      </div>

      <div className="course-card-footer">
        {user && user.role === 'Student' && (
          <>
            {enrolled ? (
              <Link 
                to={`/courses/${id}`} 
                className="btn btn-primary"
              >
                {progress > 0 ? 'Продолжить изучение' : 'Начать изучение'}
              </Link>
            ) : (
              <button 
                onClick={handleEnroll}
                className="btn btn-outline"
                disabled={Boolean(enrolled)}
              >
                Записаться на курс
              </button>
            )}
          </>
        )}
        
        {user && user.role === 'Teacher' && (
          <div className="teacher-actions">
            <Link 
              to={`/teacher/courses/${id}/edit`} 
              className="btn btn-secondary btn-sm"
            >
              Редактировать
            </Link>
            <Link 
              to={`/courses/${id}`} 
              className="btn btn-outline btn-sm"
            >
              Просмотр
            </Link>
          </div>
        )}
        
        {!user && (
          <Link 
            to="/login" 
            className="btn btn-primary"
          >
            Войти для записи
          </Link>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
