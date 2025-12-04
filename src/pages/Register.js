import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Auth.css';
import axios from 'axios';

const Register = ({ onLogin }) => {
  const [user, setUser] = useState(
    { name: '', email: '', password: '', confirmPassword: '', role: 'student', avatar: ''},
  );
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = 'https://zhalalov2.su/backend-school/users';

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'file') {
      const file = e.target.files[0];
      setUser(prev => ({ ...prev, [name]: file }));
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
    if (!user.avatar || user.avatar.length === 0) {
      newErrors.avatar = 'Загрузите 1 фото';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    console.log('[Register] submit', { user });
    console.log('[Register] API_URL', API_URL);
    try {

      const form = new FormData();
      form.append('name', user.name || '');
      form.append('email', user.email || '');
      form.append('password', user.password || '');
      form.append('role', user.role || 'student');
      if (user.avatar instanceof File) {
        form.append('avatar', user.avatar);
      }
      const response = await axios({
        method: 'post',
        url: API_URL,
        data: form,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 15000,
      });

      console.log('[Register] response status:', response.status);
      console.log('[Register] response data:', response.data);

      if (response.status === 200 || response.status === 201) {
        const created = response.data?.data || response.data || {};
        console.log('[Register] created user normalized:', created);

        if (typeof onLogin === 'function') {
          try {
            await onLogin(user.email, user.password);
          } catch (loginErr) {
            console.warn('[Register] onLogin failed:', loginErr);
          }
        }

        navigate('/');
      } else {
        const serverMsg = response.data?.error || response.data?.message || JSON.stringify(response.data);
        console.warn('[Register] server returned non-OK status', response.status, serverMsg);
        setErrors({ general: serverMsg || 'Ошибка регистрации' });
      }
    } catch (err) {

      console.error('[Register] Exception during registration:', err);
      if (err?.response) {
        console.error('[Register] err.response.data:', err.response.data);
        console.error('[Register] err.response.status:', err.response.status);
        setErrors({ general: err.response.data?.error || err.response.data?.message || 'Ошибка сервера' });
      } else if (err?.request) {
        console.error('[Register] no response received, request:', err.request);
        setErrors({ general: 'Нет ответа от сервера. Проверьте подключение.' });
      } else {
        setErrors({ general: err.message || 'Неизвестная ошибка' });
      }
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

          <div className="form-group">
            <label htmlFor="avatar" className="form-label">
              Фото профиля (можно загрузить до 5 фото)
            </label>
            {errors.avatar && (
              <span className="error-message">{errors.avatar}</span>
            )}
            <input type="file" id="avatar" name="avatar" onChange={handleChange} className="form-input" disabled={isLoading} />
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
