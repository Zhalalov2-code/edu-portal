import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../utils/authContext';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import '../css/ChatSupport.css';
import Spinner from '../components/Spinner';

function ChatSupport() {
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

            const response = await axios.post(`${API_URL_BASE}/messages_support/support`, body.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            if (response.status === 200 || response.status === 201) {
                getMessages();
            }
        } catch (error) {
        } finally {
            setMessage('');
        }
    };

    const getMessages = useCallback(async () => {
        if (!currentUser) return;
        try {
            const response = await axios.get(`${API_URL_BASE}/messages_support/users?id_sender=${currentUser.id}`);
            if (response.status === 200) {
                let messagesData = response.data;
                if (!Array.isArray(messagesData)) {
                    messagesData = Object.values(messagesData).find(val => Array.isArray(val)) || [];
                }
                const filteredMessages = messagesData.filter(msg => 
                    (msg.id_sender === currentUser.id && msg.id_getter === 1) || 
                    (msg.id_sender === 1 && msg.id_getter === currentUser.id)
                );
                const formattedMessages = filteredMessages.map(msg => ({
                    text: msg.text,
                    isSupport: String(msg.id_sender) === '1',
                    time: msg.created_at ? new Date(msg.created_at).toLocaleString('ru-RU') : '',
                }));
                setMessages(formattedMessages);
            }
        } catch (error) {
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
        return <Spinner fullScreen />;
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

export default ChatSupport;