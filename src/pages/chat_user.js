import { useState, useEffect, useCallback } from "react";
import "../css/ChatUsers.css";
import axios from "axios";
import { API_URL_BASE } from "../utils/API_URL_CONF";
import { useAuth } from "../utils/authContext";

const ChatUsers = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [allChats, setAllChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const selectedChat = allChats.find((c) => c.id_chat === selectedChatId) || null;

    const getAllUsers = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await axios.get(`${API_URL_BASE}/users`);
            if (response.status === 200) {
                let usersData = Array.isArray(response.data) ? response.data :
                    Object.values(response.data).find(Array.isArray) || [];
                const filteredUsers = usersData.filter((u) => String(u.id) !== String(user.id) && !/admin/i.test(u.role));
                setAllUsers(filteredUsers);
            }
        } catch (error) {
            console.error("❌ Ошибка при получении пользователей:", error);
        }
    }, [user]);

    const getAllChat = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await axios.get(`${API_URL_BASE}/chats?id_user1=${user.id}&id_user2=${user.id}`);
            console.log('📥 Получены чаты:', response.data);
            if (response.status === 200) {
                let chatsData = Array.isArray(response.data) ? response.data :
                    (response.data?.data && Array.isArray(response.data.data)) ? response.data.data :
                    Object.values(response.data).find(Array.isArray) || [];
                console.log('📊 Обработанные чаты:', chatsData);
                const filteredChats = chatsData.filter(chat => String(chat.id_user1) === String(user.id) || String(chat.id_user2) === String(user.id));
                console.log('✅ Отфильтрованные чаты:', filteredChats);
                setAllChats(filteredChats);
            }
        } catch (error) {
            console.error("❌ Ошибка при получении чатов:", error);
            setAllChats([]);
        }
    }, [user]);

    const readMessage = useCallback(async (chatId, currentUserId) => {
        if (!chatId || !currentUserId) return;
        try {
            const response = await axios.put(`${API_URL_BASE}/messages`, {
                id_chat: chatId,
                id_user: currentUserId
            });

            if (response.status === 200) {
                setMessages(prev => prev.map(msg =>
                    msg.from === "other" && !msg.isRead
                        ? { ...msg, isRead: true, readTime: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) }
                        : msg
                ));
            }
        } catch (error) {
            console.error("❌ Ошибка при отправке статуса прочтения:", error.response?.data || error.message);
        }
    }, []);

    const getMessages = useCallback(async () => {
        if (!selectedChat) return;
        try {
            const response = await axios.get(`${API_URL_BASE}/messages?id_chat=${selectedChat.id_chat}`);
            if (response.status === 200) {
                let messagesData = Array.isArray(response.data) ? response.data :
                    Object.values(response.data).find(Array.isArray) || [];

                const formattedMessages = messagesData.map((msg) => {
                    const isSelf = String(msg.id_user) === String(user.id);
                    const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "";
                    const readTimeStr = msg.read_time ? new Date(msg.read_time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "";

                    return {
                        id: msg.id_message || msg.id,
                        text: msg.text,
                        time: timeStr,
                        from: isSelf ? "self" : "other",
                        isRead: msg.read_status === 'read',
                        readTime: readTimeStr
                    };
                });
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error("❌ Ошибка при получении сообщений:", error);
        }
    }, [selectedChat, user]);

    useEffect(() => {
        console.log('🔄 Инициализация ChatUsers, user:', user);
        console.log('🔄 API_URL_BASE:', API_URL_BASE);
        getAllUsers();
        getAllChat();
    }, [getAllUsers, getAllChat, user]);

    useEffect(() => {
        if (!selectedChat) return;

        const syncChat = async () => {
            await getMessages();
            await readMessage(selectedChat.id_chat, user.id);
        };

        syncChat()
    }, [selectedChat, getMessages, readMessage, user.id]);

    const createNewChat = async (userId) => {
        try {
            const response = await axios.post(`${API_URL_BASE}/chats`, {
                id_user1: user.id,
                id_user2: userId
            });

            if (response.status === 200 || response.status === 201) {
                setShowNewChatModal(false);
                await getAllChat();
                const newChatId = response.data?.data?.id_chat || response.data?.id_chat;
                if (newChatId) {
                    setSelectedChatId(newChatId);
                }
            }
        } catch (error) {
            console.error("❌ Ошибка создания чата:", error.response?.data || error.message);
        }
    };

    const sendMessage = async () => {
        const text = message.trim();
        if (!text || !selectedChat) return;

        try {
            const body = new URLSearchParams();
            body.append("id_chat", selectedChat.id_chat);
            body.append("id_user", user.id);
            body.append("text", text);

            const response = await axios.post(`${API_URL_BASE}/messages`, body);

            if (response.status === 200 || response.status === 201) {
                setMessage("");
                getMessages();
            }
        } catch (error) {
            console.error("❌ Ошибка отправки:", error.response?.data || error.message);
        }
    };

    return (
        <div className="uc-chat-page">
            <div className="chat-container">
                <main className="chat-message">
                    <div className="chat-header">
                        <div className="chat-user-info">
                            <div className="support-icon">👥</div>
                            <div className="chat-user-details">
                                <h3 className="chat-user-name">Чаты</h3>
                                <p className="chat-user-role">{selectedChat ? "Диалог открыт" : "Выберите чат"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="chat-body">
                        <aside className="chat-sidebar">
                            <div className="chat-sidebar-header">
                                <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>
                                    ➕ Новый чат
                                </button>
                            </div>
                            <div className="chat-users-list">
                                {allChats && allChats.length > 0 ? (
                                    allChats.map((chat) => {
                                        const isUser1 = String(chat.id_user1) === String(user.id);
                                        const chatPartnerName = isUser1 ? chat.name_user2 : chat.name_user1;
                                        return (
                                            <div key={chat.id_chat} onClick={() => setSelectedChatId(chat.id_chat)}
                                                className={`chat-user-item ${chat.id_chat === selectedChatId ? "active" : ""}`}>
                                                <div className="chat-user-avatar">{chatPartnerName?.slice(0, 1) || "?"}</div>
                                                <div className="chat-user-meta">
                                                    <span className="chat-user-title">{chatPartnerName || "Неизвестный"}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                        <p>Нет активных чатов</p>
                                        <small>Создайте новый чат, нажав "➕ Новый чат"</small>
                                    </div>
                                )}
                            </div>
                        </aside>

                        <section className="chat-window">
                            <div className="chat-messages">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`message ${msg.from === "self" ? "user" : "support"}-message`}>
                                        <div className="message-content">
                                            <div className="message-bubble">
                                                <p>{msg.text}</p>
                                                {msg.time && <span className="message-time" style={{ fontSize: '11px', opacity: 0.6 }}>{msg.time}</span>}
                                            </div>
                                            <div className="message-info" style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                                                {msg.from === "self" && (
                                                    <span className="read-status">
                                                        {msg.isRead ? (
                                                            <span title={`Просмотрено в ${msg.readTime}`} style={{ color: '#4fc3f7', fontSize: '12px' }}>
                                                                ✔✔ <small style={{ fontSize: '10px' }}>{msg.readTime}</small>
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: '#ccc', fontSize: '12px' }}>✔</span>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input-area">
                                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                                    placeholder="Введите сообщение..." className="chat-input" disabled={!selectedChat} />
                                <button className="send-btn" onClick={sendMessage} disabled={!selectedChat || !message.trim()}>➤</button>
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {showNewChatModal && (
                <>
                    <div className="modal-overlay" onClick={() => setShowNewChatModal(false)} />
                    <div className="new-chat-modal">
                        <div className="modal-header">
                            <h3>Выберите собеседника</h3>
                            <button className="close-modal" onClick={() => setShowNewChatModal(false)}>×</button>
                        </div>
                        <div className="modal-users-list">
                            {allUsers.map((u) => (
                                <div key={u.id} className="modal-user-item" onClick={() => createNewChat(u.id)}>
                                    <div className="modal-user-avatar">
                                        {u.name?.slice(0, 1) || '?'}
                                    </div>
                                    <div className="modal-user-name">{u.name || 'Неизвестный'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatUsers;
