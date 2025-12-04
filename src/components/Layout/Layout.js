import React from 'react';
import Header from './Header';
import '../../css/Layout.css';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="app-layout">
      <Header user={user} onLogout={onLogout} />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="logo-icon">🎓</div>
                <span className="logo-text">EduPortal</span>
              </div>
              <p className="footer-description">
                Современная платформа для онлайн обучения. 
                Изучайте новые навыки вместе с лучшими преподавателями.
              </p>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Для студентов</h4>
              <ul className="footer-links">
                <li><a href="/courses">Все курсы</a></li>
                <li><a href="/profile">Мой профиль</a></li>
                <li><a href="/progress">Мой прогресс</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Для преподавателей</h4>
              <ul className="footer-links">
                <li><a href="/teacher/dashboard">Панель управления</a></li>
                <li><a href="/teacher/courses">Мои курсы</a></li>
                <li><a href="/teacher/students">Студенты</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-title">Поддержка</h4>
              <ul className="footer-links">
                <li><a href="/help">Помощь</a></li>
                <li><a href="/contact">Контакты</a></li>
                <li><a href="/about">О нас</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 EduPortal. Все права защищены.</p>
            <div className="footer-social">
              <button className="social-link" aria-label="Telegram" onClick={() => console.log('Telegram link')}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.61 7.59c-.12.54-.45.67-.91.42l-2.51-1.85-1.21 1.17c-.13.13-.25.25-.51.25l.18-2.57 4.68-4.23c.2-.18-.05-.28-.32-.1l-5.78 3.64-2.49-.78c-.54-.17-.55-.54.11-.8l9.74-3.75c.45-.17.85.11.7.8z"/>
                </svg>
              </button>
              <button className="social-link" aria-label="VK" onClick={() => console.log('VK link')}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.344 12.968c.546.549 1.127 1.09 1.613 1.692.217.27.422.547.579.86.221.442.02.928-.362 1.009l-2.402.001c-.613.051-1.094-.196-1.492-.594-.318-.318-.611-.658-.926-.969-.133-.131-.274-.246-.442-.322-.375-.169-.706-.044-.903.32-.205.375-.251.787-.27 1.205-.032.711-.243.896-.954.932-1.519.077-2.955-.169-4.25-.991-1.149-.729-2.036-1.707-2.802-2.837-.766-1.13-1.394-2.349-2.008-3.579-.199-.399-.05-.609.392-.617.733-.014 1.466-.009 2.199-.003.299.003.49.167.625.44.407 1.05.899 2.055 1.524 2.974.163.24.327.48.564.649.269.191.474.135.598-.154.089-.208.123-.431.14-.653.05-.651.044-1.302-.026-1.95-.051-.468-.26-.771-.729-.854-.236-.042-.201-.124-.087-.25.186-.204.362-.332.714-.332h2.639c.415.082.507.27.564.687l.001 2.938c-.001.181.089.718.411.837.258.096.427-.039.581-.193.732-.732 1.255-1.608 1.729-2.514.206-.394.379-.808.548-1.225.133-.327.341-.488.717-.481l2.567.003c.076.001.153.001.228.016.53.105.676.367.507.875-.24.722-.652 1.335-1.084 1.931-.454.625-.947 1.222-1.397 1.852-.423.594-.393.895.134 1.424z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
