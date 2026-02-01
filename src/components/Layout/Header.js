import { useState, useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL_BASE } from '../../utils/API_URL_CONF';
import '../../css/Header.css';

const Header = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown') && !event.target.closest('.chats-dropdown-container')) {
        setIsChatDropdownOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  return (
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
              <div className="logo-icon">🎓</div>
              <span className="logo-text">EduPortal</span>
            </Link>

            <nav className="nav-desktop">
              <Link to="/courses" className="nav-link">Курсы</Link>
              {user && (
                  <>
                    <Link to="/test" className="nav-link">Тесты</Link>
                    <Link to="/lessons" className="nav-link">Уроки</Link>
                    <Link to="/results" className="nav-link">Результаты</Link>
                    <Link to='/news' className='nav-link'>Новости</Link>

                    {user.role === 'Teacher' && (
                        <Link to="/teacher/dashboard" className="nav-link">Панель преподавателя</Link>
                    )}
                    {user.role === 'Admin' && (
                        <Link to="/admin" className="nav-link" onClick={() => setIsProfileOpen(false)}>Чат поддержки</Link>
                    )}

                    {user.role !== 'Admin' && (
                        <div className="chats-dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                              className={`nav-link dropdown-toggle-custom ${isChatDropdownOpen ? 'active' : ''}`}
                              onClick={() => setIsChatDropdownOpen(!isChatDropdownOpen)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            Чаты
                            <svg className={`chevron-icon ${isChatDropdownOpen ? 'rotate' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </button>

                          {isChatDropdownOpen && (
                              <div className="dropdown-menu show shadow" style={{ position: 'absolute', top: '100%', left: 0, display: 'block', zIndex: 1000 }}>
                                <Link to="/chat_support" className="dropdown-item" onClick={() => setIsChatDropdownOpen(false)}>
                                  💬 Чат с поддержкой
                                </Link>
                                <Link to="/chat_users" className="dropdown-item" onClick={() => setIsChatDropdownOpen(false)}>
                                  👥 Чат с пользователями
                                </Link>
                              </div>
                          )}
                        </div>
                    )}
                  </>
              )}
            </nav>

            <div className="user-menu">
              {user ? (
                  <div className="user-dropdown" style={{ position: 'relative' }}>
                    <button className="user-button" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                      <div className="user-avatar-container-header">
                        {user.avatar ? (
                            <img src={`${API_URL_BASE}/uploads/${user.avatar}`} alt="Avatar" className="user-avatar-header" />
                        ) : (
                            user.name ? user.name.charAt(0).toUpperCase() : '?'
                        )}
                      </div>
                      <span className="user-name">{user.name || 'Пользователь'}</span>
                    </button>

                    {isProfileOpen && (
                        <div className="dropdown-menu show shadow" style={{ position: 'absolute', right: 0, top: '100%', display: 'block', zIndex: 1000 }}>
                          <Link to="/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>👤 Профиль</Link>
                          <Link to="/results" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>📊 Результаты</Link>

                          <div className="dropdown-divider"></div>
                          <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                            🚪 Выйти
                          </button>
                        </div>
                    )}
                  </div>
              ) : (
                  <div className="auth-buttons">
                    <Link to="/login" className="btn btn-outline btn-sm">Войти</Link>
                    <Link to="/register" className="btn btn-primary btn-sm">Регистрация</Link>
                  </div>
              )}

              <button className="mobile-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '24px' }}>
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {isMenuOpen && (
              <div className="mobile-nav shadow-lg">
                <Link to="/courses" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Курсы</Link>
                {user && (
                    <>
                      <Link to="/lessons" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Уроки</Link>
                      <Link to="/test" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Тесты</Link>
                      <Link to="/chat_support" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Чат поддержки</Link>
                      <Link to="/chat_users" className="mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Чат пользователей</Link>
                      <button className="mobile-nav-link text-danger" onClick={handleLogout}>Выйти</button>
                    </>
                )}
                {!user && (
                    <div className="mobile-auth-buttons p-3">
                      <Link to="/login" className="btn btn-outline w-100 mb-2" onClick={() => setIsMenuOpen(false)}>Войти</Link>
                      <Link to="/register" className="btn btn-primary w-100" onClick={() => setIsMenuOpen(false)}>Регистрация</Link>
                    </div>
                )}
              </div>
          )}
        </div>
      </header>
  );
};

export default Header;