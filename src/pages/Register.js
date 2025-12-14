import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Auth.css';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';

const Register = () => {
  const [user, setUser] = useState(
    { name: '', email: '', password: '', confirmPassword: '', role: 'student', avatar: '' },
  );
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = `${API_URL_BASE}/users`;

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      setUser(prev => ({ ...prev, [name]: e.target.files[0] }));
    } else {
      setUser(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!user.name.trim()) {
      newErrors.name = 'Имя обязательно для заполнения';
    }
    if (!user.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      newErrors.email = 'Введите корректный email';
    }
    if (!user.password) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (user.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    if (user.password !== user.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    if (!user.role) {
      newErrors.role = 'Выберите роль';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {

      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const firebaseUser = userCredential.user;

      const body = new URLSearchParams();
      body.append('uid', firebaseUser.uid);
      body.append('name', user.name || '');
      body.append('email', firebaseUser.email || '');
      body.append('password', user.password || '');
      body.append('role', user.role || 'student');

      const response = await axios({
        method: 'post',
        url: API_URL,
        data: body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000,
      });

      if (response.status === 200 || response.status === 201) {
        navigate('/login');
        alert('Регистрация прошла успешно! Теперь вы можете войти в систему.');
      } else {
        console.error('Ошибка регистрации:', response);
      }
    } catch (err) {
      setErrors({ general: 'Ошибка при регистрации' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🎓</div>
          </div>
          <h1 className="auth-title">Создать аккаунт</h1>
          <p className="auth-subtitle">Присоединяйтесь к нашей платформе</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="alert alert-error">
              {errors.general}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Полное имя
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={user.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Введите ваше имя"
              disabled={isLoading}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="your@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role" className="form-label">
              Роль
            </label>
            <select
              id="role"
              name="role"
              value={user.role}
              onChange={handleChange}
              className="form-input form-select"
              disabled={isLoading}
            >
              <option value="student">👨‍🎓 Студент</option>
              <option value="teacher">👨‍🏫 Преподаватель</option>
              <option value="admin">👨‍💼 Админ</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={user.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Минимум 6 символов"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Подтвердите пароль
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={user.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Повторите пароль"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Регистрация...
                </>
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Уже есть аккаунт?{' '}
              <Link to="/login" className="auth-link">
                Войти
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
