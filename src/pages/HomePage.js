import { Link } from 'react-router-dom';
import '../css/HomePage.css';

const HomePage = ({ user }) => {
  const features = [
    {
      icon: '🎓',
      title: 'Качественное образование',
      description: 'Курсы от лучших преподавателей с практическим опытом'
    },
    {
      icon: '📱',
      title: 'Удобная платформа',
      description: 'Современный интерфейс, доступный с любого устройства'
    },
    {
      icon: '🏆',
      title: 'Сертификаты',
      description: 'Получайте сертификаты о прохождении курсов'
    },
    {
      icon: '👥',
      title: 'Сообщество',
      description: 'Общайтесь с единомышленниками и преподавателями'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Студентов' },
    { number: '50+', label: 'Курсов' },
    { number: '20+', label: 'Преподавателей' },
    { number: '95%', label: 'Довольных студентов' }
  ];

  return (
    <div className="homepage">
      
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Изучайте новые навыки с{' '}
                <span className="hero-accent">EduPortal</span>
              </h1>
              <p className="hero-description">
                Получите доступ к лучшим онлайн курсам от экспертов индустрии. 
                Развивайте свои навыки в удобном темпе и достигайте новых высот в карьере.
              </p>
              
              <div className="hero-actions">
                {user ? (
                  <div className="user-actions">
                    <Link to="/courses" className="btn btn-primary btn-lg">
                      Перейти к курсам
                    </Link>
                    <Link to="/profile" className="btn btn-outline btn-lg">
                      Мой профиль
                    </Link>
                    {user.role === 'Student' && (
                      <Link to="/courses" className="btn btn-accent btn-lg btn-accent-margin">
                        Записаться на курсы
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="guest-actions">
                    <Link to="/register" className="btn btn-primary btn-lg">
                      Начать обучение
                    </Link>
                    <Link to="/login" className="btn btn-outline btn-lg">
                      Войти
                    </Link>
                  </div>
                )}
              </div>

              <div className="hero-stats">
                {stats.map((stat, index) => (
                  <div key={index} className="stat-item">
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="hero-card">
                <div className="hero-card-header">
                  <div className="hero-card-avatar">👨‍🎓</div>
                  <div className="hero-card-info">
                    <div className="hero-card-name">Студент</div>
                    <div className="hero-card-progress">Прогресс: 75%</div>
                  </div>
                </div>
                <div className="hero-card-body">
                  <div className="progress-bar-demo">
                    <div className="progress-fill-demo"></div>
                  </div>
                  <div className="hero-card-courses">
                    <div className="course-item">📚 React.js</div>
                    <div className="course-item">🐍 Python</div>
                    <div className="course-item">🎨 UI/UX Design</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Почему выбирают нас?</h2>
            <p className="section-description">
              Мы предлагаем лучшие условия для вашего обучения и развития
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">
              Готовы начать свое обучение?
            </h2>
            <p className="cta-description">
              Присоединяйтесь к тысячам студентов, которые уже развивают свои навыки с нами
            </p>
            
            {!user && (
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Зарегистрироваться бесплатно
                </Link>
                <Link to="/courses" className="btn btn-outline btn-lg">
                  Посмотреть курсы
                </Link>
              </div>
            )}
            
            {user && (
              <div className="cta-actions">
                <Link to="/courses" className="btn btn-primary btn-lg">
                  Выбрать новый курс
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
