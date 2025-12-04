import React from 'react';
import ReactDOM from 'react-dom/client';
import './css/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Если вы хотите начать измерять производительность в приложении, передайте функцию
// для логирования результатов (например: reportWebVitals(console.log))
// или отправки на аналитический эндпоинт (точку приёма аналитики). Подробнее: https://bit.ly/CRA-vitals
reportWebVitals();
