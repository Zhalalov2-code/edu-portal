import { useState, useEffect, useCallback } from 'react';
import '../css/ChatUsers.css';
import axios from 'axios';
import { API_URL_BASE } from '../utils/API_URL_CONF';
import { useAuth } from '../utils/authContext';

const ChatUsers = () => {
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [allChats, setAllChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [selectedChatId, setSelectedChatId] = useState(null);
    const selectedChat = allChats.find(c => c.id_chat === selectedChatId) || null;

    const getAllUsers = useCallback(async () => {
        if (!user || !user.id) {
            return;
        }
        try {
            const response = await axios.get(`${API_URL_BASE}/users`);
            if (response.status === 200) {
                let usersData = [];
                if (Array.isArray(response.data)) {
                    usersData = response.data;
                } else {
                    usersData = Object.values(response.data).find(val => Array.isArray(val)) || [];
                }
                const filteredUsers = usersData.filter((u) => {
                    const isSelf = String(u.id) === String(user.id);
                    const roleStr = typeof u.role === 'string' ? u.role : '';
                    const isAdmin = /admin/i.test(roleStr);
                    return !isSelf && !isAdmin;
                });
                setAllUsers(filteredUsers);
            }
        } catch (error) {
            console.error('Ошибка при получении списка пользователей:', error);
        }
    }, [user]);

    const getAllChat = useCallback(async () => {
        if (!user || !user.id) {
            return;
        }
        try {
            const response = await axios.get(`${API_URL_BASE}/chats?id_guser1=${user.id}&id_user2=${user.id}`);
            if (response.status === 200) {
                let chatsData = [];
                if (Array.isArray(response.data)) {
                    chatsData = response.data;
                } else {
                    chatsData = Object.values(response.data).find(val => Array.isArray(val)) || [];
                }
                const filteredChats = chatsData.filter((chat) => {
                    return String(chat.id_user1) === String(user.id) || String(chat.id_user2) === String(user.id);
                });
                setAllChats(filteredChats);
            }
        } catch (error) {
            console.error('Ошибка при получении списка чатов:', error);
        }
    }, [user]);

    const getMessages = useCallback(async () => {
        if (!selectedChat) return;
        try {
            const response = await axios.get(`${API_URL_BASE}/messages?id_chat=${selectedChat.id_chat}`);
            if (response.status === 200) {
                let messagesData = [];
                if (Array.isArray(response.data)) {
                    messagesData = response.data;
                } else {
                    messagesData = Object.values(response.data).find(val => Array.isArray(val)) || [];
                }
                
                const formattedMessages = messagesData.map((msg) => {
                    let timeStr = '';
                    if (msg.created_at) {
                        const date = new Date(msg.created_at);
                        if (!isNaN(date.getTime())) {
                            timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        }
                    }
                    const isSelf = String(msg.id_user) === String(user.id);
                    return {
                        id: msg.id_message || msg.id,
                        text: msg.text,
                        time: timeStr,
                        from: isSelf ? 'other' : 'self',
                    };
                });
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error('Ошибка при получении сообщений:', error);
        }
    }, [selectedChat, user]);

    useEffect(() => {
        getAllUsers();
        getAllChat();
    }, [getAllUsers, getAllChat]);

    useEffect(() => {
        if (!selectedChat) return;
        getMessages();
    }, [selectedChat, getMessages]);

    const createChat = async (userId, nameGetter) => {
        const existinsgChat = allChats.find(chat =>
            (String(chat.id_user1) === String(user.id) && String(chat.id_user2) === String(userId)) ||
            (String(chat.id_user2) === String(user.id) && String(chat.id_user1) === String(userId))
        );
        if (existinsgChat) {
            return;
        }

        try {
            const body = new URLSearchParams();
            body.append('id_user1', String(user.id));
            body.append('id_user2', String(userId));
            body.append('name_user1', user.name || null);
            body.append('name_user2', nameGetter || null);

            const response = await axios.post(`${API_URL_BASE}/chats`, body);
            if (response.status === 200 || response.status === 201) {
                getAllChat();
            }
        } catch (error) {
            console.error('Ошибка при создании чата:', error);
        }
    }

    const sendMessage = async () => {
        try {
            const text = message.trim();
            if (text.length === 0) {
                return;
            }
            const body = new URLSearchParams();
            body.append('id_chat', selectedChat.id_chat);
            body.append('id_user', user.id);
            body.append('text', message);

            const response = await axios.post(`${API_URL_BASE}/messages`, body);
            if (response.status === 200 || response.status === 201) {
                console.log('Сообщение отправлено', response.data);
                setMessage('');
                getMessages();
            }
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
        }
    }

    return (
        <div className="uc-chat-page">
            <div className="chat-container">
                <main className="chat-message" aria-label="Чат с пользователями">
                    <div className="chat-header">
                        <div className="chat-user-info">
                            <div className="support-icon">👥</div>
                            <div className="chat-user-details">
                                <h3 className="chat-user-name">Чаты с пользователями</h3>
                                <p className="chat-user-role">Выберите пользователя слева, чтобы открыть диалог</p>
                            </div>
                        </div>
                    </div>

                    <div className="chat-body">
                        <aside className="chat-sidebar" aria-label="Список пользователей">
                            <div className="chat-sidebar-header">
                                <h4>Пользователи</h4>
                                <input
                                    type="text"
                                    className="chat-input search"
                                    placeholder="Поиск по имени..."
                                    aria-label="Поиск пользователя"
                                />
                            </div>
                            <div className="chat-users-list">
                                {allChats.map((chat, idx) => {
                                    const isUser1 = String(chat.id_user1) === String(user.id);
                                    const chatPartnerName = isUser1 ? chat.name_user2 : chat.name_user1;

                                    return (
                                        <div key={chat.id_chat} onClick={() => setSelectedChatId(chat.id_chat)} className={`chat-user-item ${chat.id_chat === selectedChatId ? 'active' : ''}`}>
                                            <div className="chat-user-avatar">{chatPartnerName?.slice(0, 1) || '?'}</div>
                                            <div className="chat-user-meta">
                                                <div className="chat-user-name-row">
                                                    <span className="chat-user-title">{chatPartnerName || 'Неизвестный'}</span>
                                                </div>
                                                <div className="chat-user-last">Нажмите, чтобы открыть чат</div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ padding: '8px 16px' }}>
                                    <button
                                        className="new-chat-btn"
                                        onClick={() => setIsNewChatOpen(true)}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '8px' }}>
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                        Новый чат
                                    </button>
                                </div>
                                {isNewChatOpen && (
                                    <>
                                        <div className="modal-overlay" onClick={() => setIsNewChatOpen(false)} />
                                        <div className="new-chat-modal">
                                            <div className="modal-header">
                                                <h3>Выберите пользователя</h3>
                                                <button
                                                    className="close-modal"
                                                    onClick={() => setIsNewChatOpen(false)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="modal-search">
                                                <input
                                                    type="text"
                                                    className="chat-input search"
                                                    placeholder="Поиск пользователя..."
                                                />
                                            </div>
                                            <div className="modal-users-list">
                                                {allUsers.map((us) => (
                                                    <div
                                                        key={us.id}
                                                        className="modal-user-item"
                                                        onClick={() => {
                                                            createChat(us.id, us.name);
                                                            setIsNewChatOpen(false);
                                                        }}
                                                    >
                                                        <div className="modal-user-avatar">{us.name.slice(0, 1)}</div>
                                                        <span className="modal-user-name">{us.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </aside>

                        <section className="chat-window" aria-label="Окно диалога">
                            <div className="chat-messages">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`message ${msg.from === 'self' ? 'support' : 'user'}-message`}>
                                        <div className="message-content">
                                            <div className="message-bubble">
                                                <p>{msg.text}</p>
                                            </div>
                                            {msg.time && <span className="message-time">{msg.time}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input-area">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder={selectedChat ? "Введите сообщение..." : "Выберите чат"}
                                    className="chat-input"
                                    aria-label="Поле ввода сообщения"
                                    disabled={!selectedChat}
                                />
                                <button
                                    className="send-btn"
                                    aria-label="Отправить сообщение"
                                    onClick={sendMessage}
                                    disabled={!selectedChat || !message.trim()}
                                    style={{ opacity: (!selectedChat || !message.trim()) ? 0.5 : 1 }}
                                >
                                    ➤
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChatUsers;
