import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../utils/authContext';
import axios from 'axios';
import '../css/Chat.css';

function Chat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    const { user: currentUser, isLoading } = useAuth();

    const handleSendMessage = async () => {
        const text = message.trim();
        if (!text && !currentUser) return;
        try {
            const body = new URLSearchParams();
            body.append('id_sender', currentUser.id);
            body.append('text', text);
            body.append('id_getter', '1');
            body.append('name_sender', currentUser.name);

            const response = await axios.post('https://zhalalov2.su/backend-school/messages/support', body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.status === 200 || response.status === 201) {
                getMessages();
            }
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
        } finally {
            setMessage('');
        }
    };

    const getMessages = useCallback(async () => {
        if (!currentUser) return;
        try {
            const response = await axios.get(`https://zhalalov2.su/backend-school/messages/support?id_getter=${currentUser.id}&id_sender=${currentUser.id}`);
            if (response.status === 200) {
                let messagesData = response.data;
                if (!Array.isArray(messagesData)) {
                    messagesData = Object.values(messagesData).find(val => Array.isArray(val)) || [];
                }
                const formattedMessages = messagesData.map(msg => ({
                    text: msg.text,
                    isSupport: String(msg.id_sender) === '1',
                    time: msg.time || '',
                }));
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Ошибка при получении сообщений:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        getMessages();
    }, [getMessages]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    if (isLoading) {
        return (
            <div className="chat-container">
                <div className="auth-message">
                    <h3>Загрузка...</h3>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="chat-container">
                <div className="auth-message">
                    <h3>Для использования чата необходимо войти в систему</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <main className='chat-message support-chat' aria-label="Чат с поддержкой">
                <div className="chat-header">
                    <div className="chat-user-info">
                        <div className="support-icon">💬</div>
                        <div className="chat-user-details">
                            <h3 className="chat-user-name">Служба поддержки</h3>
                        </div>
                    </div>
                </div>

                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="empty-chat">
                            <div className="welcome-message">
                                <h4>👋 Здравствуйте!</h4>
                                <p>Добро пожаловать в службу поддержки</p>
                                <small>Мы готовы помочь вам с любыми вопросами</small>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.isSupport ? 'support' : 'user'}-message`}
                            >
                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>{msg.text}</p>
                                    </div>
                                    <span className="message-time">{msg.time || msg.name_sender}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="chat-input-area">
                    <button className="attachment-btn" aria-label="Прикрепить файл">📎</button>
                    <div className="input-wrapper">
                        <input
                            type="text"
                            placeholder="Напишите ваш вопрос..."
                            className="chat-input"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            aria-label="Поле ввода сообщения"
                        />
                        <button className="emoji-btn" aria-label="Вставить эмодзи">😊</button>
                    </div>
                    <button
                        onClick={handleSendMessage}
                        className="send-btn"
                        aria-label="Отправить сообщение"
                    >
                        ➤
                    </button>
                </div>
            </main>
        </div>
    );
}

export default Chat;