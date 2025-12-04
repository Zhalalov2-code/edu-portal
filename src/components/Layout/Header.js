import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/Header.css';

const Header = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          {/* Логотип */}
          <Link to="/" className="logo">
            <div className="logo-icon">🎓</div>
            <span className="logo-text">EduPortal</span>
          </Link>

          {/* Навигация для десктопа */}
          <nav className="nav-desktop">
            <Link to="/courses" className="nav-link">
              Курсы
            </Link>
            {user && (
              <>
                <Link to="/test" className="nav-link">
                  Тесты
                </Link>
                <Link to="/lessons" className="nav-link">
                  Уроки
                </Link>
              </>
            )}
            {user && (
              <>
                {user.role === 'Admin' && (
                  <Link to="/admin" className="nav-link">
                    Чат поддержки
                  </Link>
                )}
                {user.role === 'Teacher' && (
                  <Link to="/teacher/dashboard" className="nav-link">
                    Панель преподавателя
                  </Link>
                )}
                <Link to="/results" className="nav-link">
                  Результаты
                </Link>
                <Link to="/profile" className="nav-link">
                  Профиль
                </Link>
                {user.role !== 'Admin' && (
                  <Link to="/chat" className="nav-link">
                    Чат
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="user-menu">
            {user ? (
              <div className="user-dropdown">
                <button 
                  className="user-button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <div className="user-avatar-container-header">
                    {user.avatar ? (
                      <img src={`https://zhalalov2.su/backend-school/uploads/${user.avatar}`} alt="Avatar" className="user-avatar-header" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="user-name">{user.name}</span>
                  <svg className="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="dropdown-menu">
                    <Link 
                      to="/profile" 
                      className="dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="dropdown-item-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Мой профиль
                    </Link>

                    <Link 
                      to="/results" 
                      className="dropdown-item"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <svg className="dropdown-item-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h3.586l1.707-1.707a1 1 0 011.414 0L11.414 10H17a1 1 0 010 2h-6a1 1 0 01-.707-.293L8 10.414 6.414 12H3a1 1 0 01-1-1z" />
                        <path d="M3 5a1 1 0 011-1h12a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5zm2 1v9h10V6H5z" />
                      </svg>
                      Мои результаты
                    </Link>

                    {user.role === 'Admin' && (
                      <Link 
                        to="/admin" 
                        className="dropdown-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="dropdown-item-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        Панель администратора
                      </Link>
                    )}
                    
                    {user.role === 'teacher' && (
                      <Link 
                        to="/teacher/dashboard" 
                        className="dropdown-item"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <svg className="dropdown-item-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Панель преподавателя
                      </Link>
                    )}
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item dropdown-item-danger"
                      onClick={handleLogout}
                    >
                      <svg className="dropdown-item-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                      Выйти
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Войти
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Регистрация
                </Link>
              </div>
            )}
          </div>

          {/* Мобильное меню */}
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Мобильная навигация */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <Link 
              to="/courses" 
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Курсы
            </Link>
            {user && (
              <>
                <Link
                  to="/lessons"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Уроки
                </Link>
                <Link
                  to="/test"
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Тесты
                </Link>
              </>
            )}
            
            {user ? (
              <>
                {user.role === 'Admin' && (
                  <Link 
                    to="/admin" 
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Панель администратора
                  </Link>
                )}
                {user.role === 'teacher' && (
                  <Link 
                    to="/teacher/dashboard" 
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Панель преподавателя
                  </Link>
                )}
                <Link 
                  to="/results" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Мои результаты
                </Link>
                <Link 
                  to="/profile" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Профиль
                </Link>
                {user.role !== 'Admin' && (
                  <Link 
                    to="/chat" 
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Чат
                  </Link>
                )}
                <button 
                  className="mobile-nav-link mobile-nav-logout"
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-outline"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Войти
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
