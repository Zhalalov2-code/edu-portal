import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Auth.css';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import { useAuth } from '../utils/authContext';
import { signWithGoogle } from '../utils/firebaseConfig';
import Spinner from '../components/Spinner';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен для заполнения';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен для заполнения';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL_BASE}/users`, {
        params: {
          email: formData.email,
          password: formData.password
        }
      });
      if (response.status === 200 && response.data.user) {
        const userData = {
          ...response.data.user,
          provider: 'backend'
        };
        try {
          const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
          const auth = getAuth();
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
        } catch (firebaseErr) {
          console.error('Firebase sign-in error:', firebaseErr);
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        navigate('/');
      } else {
        setErrors({ general: 'Неправильный email или пароль' });
      }
    } catch (err) {
      setErrors({ general: 'Неправильный email или пароль' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignWithGoogle = async () => {
    try {
      const result = await signWithGoogle();
      const googleUser = result.user;

      const response = await axios.get(`${API_URL_BASE}/users?uid=${googleUser.uid}`);
      let users = response.data.data || response.data.user || response.data;

      if (users && !Array.isArray(users) && typeof users === 'object') {
        users = [users];
      }

      if (Array.isArray(users)) {
        users = users.filter(u => u && (u.uid || u.email));
      }

      let matched = null;
      if (Array.isArray(users) && users.length > 0) {
        matched = users.find(u => String(u.uid) === String(googleUser.uid) || u.email === googleUser.email);
      }

      if (matched) {
        const userToStore = {
          ...matched,
          uid: googleUser.uid,
          provider: 'google'
        };
        localStorage.setItem('user', JSON.stringify(userToStore));
        setUser(userToStore);
        navigate('/');
      } else {
        setGoogleUserData(googleUser);
        setShowRoleModal(true);
      }
    } catch (err) {
      console.error('Ошибка входа через Google:', err);
      setErrors({ general: 'Ошибка входа через Google' });
    }
  };

  const handleRoleSelect = async (role) => {
    try {
      const params = new URLSearchParams();
      params.append('uid', googleUserData.uid);
      params.append('name', googleUserData.displayName || 'Google User');
      params.append('email', googleUserData.email || '');
      params.append('password', Math.random().toString(36).slice(-8));
      params.append('role', role);
      
      const createResponse = await axios.post(`${API_URL_BASE}/users`, params);
      let userInfo = createResponse.data.data || createResponse.data.user || createResponse.data;
      
      if (Array.isArray(userInfo)) {
        userInfo = userInfo[0];
      }
      
      const userToStore = {
        ...userInfo,
        uid: googleUserData.uid,
        provider: 'google'
      };
      
      localStorage.setItem('user', JSON.stringify(userToStore));
      setUser(userToStore);
      setShowRoleModal(false);
      navigate('/');
    } catch (err) {
      console.error('Ошибка создания пользователя:', err);
      setErrors({ general: 'Ошибка создания аккаунта' });
    }
  };

  if (isLoading) {
    return <Spinner fullScreen />;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🎓</div>
          </div>
          <h1 className="auth-title">Добро пожаловать!</h1>
          <p className="auth-subtitle">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {errors.general && (
            <div className="alert alert-error">{errors.general}</div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="your@email.com"
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Введите пароль"
              disabled={isLoading}
              autoComplete="current-password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span> Вход...
                </>
              ) : (
                'Войти'
              )}
            </button>
            <br />
            <span className='ili'>или</span>
            <button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={handleSignWithGoogle}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              Войти через Google
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Нет аккаунта?{' '}
              <Link to="/register" className="auth-link">Зарегистрироваться</Link>
            </p>
          </div>
        </form>
      </div>

      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Выберите вашу роль</h2>
            <p>Что вы хотите быть в нашей системе?</p>
            <div className="role-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => handleRoleSelect('Student')}
              >
                👨‍🎓 Студент
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => handleRoleSelect('Teacher')}
              >
                👨‍🏫 Преподаватель
              </button>
               <button 
                className="btn btn-primary"
                onClick={() => handleRoleSelect('Admin')}
              >
                👨Админ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
