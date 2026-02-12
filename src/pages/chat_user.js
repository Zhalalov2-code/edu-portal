import { useState, useEffect, useCallback, useRef } from "react";
import "../css/ChatUsers.css";
import axios from "axios";
import { API_URL_BASE } from "../utils/API_URL_CONF";
import { useAuth } from "../utils/authContext";
import { EllipsisVertical } from "lucide-react";
import ModalDetailsChats from "../components/detailsChatsModal";
import Spinner from '../components/Spinner';

const ChatUsers = () => {
    const { user } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [allChats, setAllChats] = useState([]);
    const [allGroupChats, setAllGroupChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const groupName = useRef(null);
    const combinedChats = [...allChats, ...allGroupChats.map(g => ({
        ...g, id_chat: g.id_group
    }))];
    const selectedChatCombined = combinedChats.find((c) => c.id_chat === selectedChatId) || null;

    const getAllUsers = useCallback(async () => {
        if (!user?.id) return;
        try {
            const response = await axios.get(`${API_URL_BASE}/users`);
            if (response.status === 200) {
                let usersData = Array.isArray(response.data) ? response.data : Object.values(response.data).find(Array.isArray) || [];
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
            if (response.status === 200) {
                let chatsData = Array.isArray(response.data) ? response.data : (response.data?.data && Array.isArray(response.data.data)) ? response.data.data : Object.values(response.data).find(Array.isArray) || [];
                const filteredChats = chatsData.filter(chat => String(chat.id_user1) === String(user.id) || String(chat.id_user2) === String(user.id));
                setAllChats(filteredChats);
            }
        } catch (error) {
            console.error("❌ Ошибка при получении чатов:", error);
            setAllChats([]);
        }
    }, [user]);

    const getAllGroupChat = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL_BASE}/group_chats?id_user=${user.id}`);
            if (response.status === 200 || response.status === 201) {
                let groupChatsData = Array.isArray(response.data) ? response.data : (response.data?.data && Array.isArray(response.data.data)) ? response.data.data : Object.values(response.data).find(Array.isArray) || [];
                const filteredGroupChats = groupChatsData.filter(chat => chat.users && chat.users.some(u => String(u.id_user) === String(user.id)));
                setAllGroupChats(filteredGroupChats);
            }
        } catch (error) {
            console.error("❌ Ошибка при получении групповых чатов:", error);
            setAllGroupChats([]);
        }
    }, [user]);

    const readMessage = useCallback(async (chatId, currentUserId) => {
        if (!chatId || !currentUserId) return;
        try {
            const response = await axios.put(`${API_URL_BASE}/messages`, {
                id_chat: chatId, id_user: currentUserId
            });

            if (response.status === 200) {
                setMessages(prev => prev.map(msg => msg.from === "other" && !msg.isRead ? {
                    ...msg,
                    isRead: true,
                    readTime: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                } : msg));
            }
        } catch (error) {
            console.error("❌ Ошибка при отправке статуса прочтения:", error.response?.data || error.message);
        }
    }, []);

    const getMessages = useCallback(async () => {
        if (!selectedChatCombined) return;
        const isGroup = !!selectedChatCombined.group_name;
        const endpoint = isGroup ? `${API_URL_BASE}/group_messages` : `${API_URL_BASE}/messages`;
        const param = isGroup ? `id_group=${selectedChatCombined.id_chat}` : `id_chat=${selectedChatCombined.id_chat}`;
        try {
            const response = await axios.get(`${endpoint}?${param}`);
            if (response.status === 200) {
                let messagesData = Array.isArray(response.data) ? response.data : Object.values(response.data).find(Array.isArray) || [];

                const formattedMessages = messagesData.map((msg) => {
                    const senderId = msg.id_user || msg.user_id;
                    const isSelf = String(senderId) === String(user.id);
                    const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString("ru-RU", {
                        hour: "2-digit", minute: "2-digit"
                    }) : "";
                    const readTimeStr = msg.read_time ? new Date(msg.read_time).toLocaleTimeString("ru-RU", {
                        hour: "2-digit", minute: "2-digit"
                    }) : "";

                    return {
                        id: msg.id_message || msg.id,
                        text: msg.text,
                        time: timeStr,
                        from: isSelf ? "self" : "other",
                        isRead: msg.read_status === 'read',
                        readTime: readTimeStr,
                        sender_name: msg.sender_name || 'Пользователь'
                    };
                });
                setMessages(formattedMessages);
            }
        } catch (error) {
            console.error("❌ Ошибка при получении сообщений:", error);
        }
    }, [selectedChatCombined, user]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([getAllUsers(), getAllChat(), getAllGroupChat()]);
            setIsLoading(false);
        };
        loadData();
    }, [getAllUsers, getAllChat, getAllGroupChat]);

    useEffect(() => {
        if (!selectedChatCombined || !selectedChatId) {
            setMessages([]);
            return;
        }

        const syncChat = async () => {
            await getMessages();
            await readMessage(selectedChatCombined.id_chat, user.id);
        };

        syncChat()
    }, [selectedChatId, selectedChatCombined, getMessages, readMessage, user.id]);

    const createNewChat = async (userId) => {
        try {
            const body = new URLSearchParams();
            body.append("id_user1", user.id);
            body.append("id_user2", userId);
            body.append('name_user1', user.name || 'Пользователь');
            body.append('name_user2', allUsers.find(u => String(u.id) === String(userId))?.name || 'Пользователь');

            const response = await axios.post(`${API_URL_BASE}/chats`, body);

            if (response.data?.status && ![200, 201].includes(response.data.status)) {
                return;
            }

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

    const createGroupChat = async (userIds) => {
        if (!userIds || userIds.length === 0) {
            alert("Выберите минимум одного пользователя");
            return;
        }

        try {
            const usersData = userIds.map(id => {
                const foundUser = allUsers.find(u => String(u.id) === String(id));
                return {
                    id_user: id, name_user: foundUser?.name || 'Пользователь'
                };
            });

            usersData.push({
                id_user: user.id, name_user: user.name || 'Пользователь'
            });

            const payload = {
                group_name: groupName.current?.value || 'Групповой чат', users: usersData
            };

            const response = await axios.post(`${API_URL_BASE}/group_chats`, payload);

            if (response.data?.status && ![200, 201].includes(response.data.status)) {
                alert(`Ошибка сервера: ${response.data.message || 'Неизвестная ошибка'}`);
                return;
            }

            if (response.status === 200 || response.status === 201) {
                setIsGroupChat(false);
                setSelectedGroupUsers([]);

                await getAllGroupChat();

                const newChatId = response.data?.data?.id_group || response.data?.id_group;

                if (newChatId) {
                    setSelectedChatId(newChatId);
                }
            }

        } catch (error) {
            console.error("🔴 КРИТИЧЕСКАЯ ОШИБКА ПРИ СОЗДАНИИ:");

            if (error.response) {
                console.error("Данные ошибки от сервера:", error.response.data);
                console.error("Статус ответа:", error.response.status);
                console.error("Заголовки ответа:", error.response.headers);
            } else if (error.request) {
                console.error("Запрос отправлен, но ответа нет (Network Error):", error.request);
            } else {
                console.error("Ошибка настройки запроса:", error.message);
            }

            alert("Ошибка при создании группового чата. Проверьте консоль (F12)");
        }
    };

    const sendMessage = async () => {
        const text = message.trim();
        if (!message.trim() || !selectedChatCombined) return;

        const isGroup = !!selectedChatCombined.group_name;

        try {
            const body = new URLSearchParams();

            if (isGroup) {
                body.append("id_group", selectedChatCombined.id_chat);
                body.append("user_id", user.id);
                body.append("text", text);
                body.append("sender_name", user.name || 'Пользователь');
            } else {
                body.append("id_chat", selectedChatCombined.id_chat);
                body.append("id_user", user.id);
                body.append("text", text);
            }

            const endpoint = isGroup ? `${API_URL_BASE}/group_messages` : `${API_URL_BASE}/messages`;
            const response = await axios.post(endpoint, body);

            if (response.status === 200 || response.status === 201) {
                setMessage("");
                await getMessages();
            }
        } catch (error) {
            console.error("❌ Ошибка при отправке сообщения:", error.response?.data || error.message);
        }
    }

    const deleteChat = async (chatToDelete) => {
        if (!window.confirm("Вы уверены, что хотите удалить этот чат?")) {
            return;
        }
        const isGroup = !!chatToDelete.group_name;
        const chatId = chatToDelete.id_chat;

        if (String(selectedChatId) === String(chatId) && isGroup) {
            setSelectedChatId(null);
            setMessages([]);
        }

        try {
            const endpointMessages = isGroup ? `${API_URL_BASE}/group_messages?id_group=${chatId}` : `${API_URL_BASE}/messages?id_chat=${chatId}`;
            await axios.delete(endpointMessages);
            const endpoint = isGroup ? `${API_URL_BASE}/group_chats/${chatId}` : `${API_URL_BASE}/chats/${chatId}`;
            const response = await axios.delete(endpoint);
            if (response.status === 200 || response.status === 201) {
                if (selectedChatId === chatId) {
                    setSelectedChatId(null);
                    setMessages([]);
                }
                if (isGroup) {
                    await getAllGroupChat();
                } else {
                    await getAllChat();
                }
            }
        } catch (error) {
            console.error("❌ Ошибка при удалении чата:", error.response?.data || error.message);
            alert('Не удалось удалить чат. Проверьте консоль (F12)');
        }
    }

    const openDetailsModal = () => {
        setShowDetailsModal(true);
    };

    const onRemoveUserFromGroup = async (groupId, userId) => {

        try {
            const url = `${API_URL_BASE}/group_chats/${groupId}/${userId}`;
            const response = await axios.delete(url);

            if (response.status === 200 || response.status === 201) {
                await getAllGroupChat();

                if (String(userId) === String(user.id)) {
                    setSelectedChatId(null);
                    setMessages([]);
                    setShowDetailsModal(false);
                }
                alert('Пользователь успешно удален');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Не удалось удалить пользователя';
            alert(`Ошибка: ${errorMsg}`);
        }
    };

    if (isLoading) {
        return <Spinner fullScreen />;
    }

    return (<div className="uc-chat-page">
        <div className="chat-container">
            <main className="chat-message">
                <div className="chat-header">
                    <div className="chat-user-info">
                        <div className="support-icon">{selectedChatCombined?.group_name ? '👥' : '💬'}</div>
                        <div className="chat-user-details">
                            <h3 className="chat-user-name">Чаты</h3>
                            <p className="chat-user-role">
                                {selectedChatCombined ? (selectedChatCombined.group_name ? `Группа: ${selectedChatCombined.group_name}` : `Чат открыт`) : "Выберите чат"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="chat-body">
                    <aside className="chat-sidebar">
                        <div className="chat-sidebar-header">
                            <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>
                                ➕ Новый чат
                            </button>
                            <button className="new-chat-btn" onClick={() => setIsGroupChat(true)}>
                                ➕ Создать групповой чат
                            </button>
                        </div>
                        <div className="chat-users-list">
                            {combinedChats && combinedChats.length > 0 ? (combinedChats.map((chat) => {
                                // Для групповых чатов
                                if (chat.group_name) {
                                    return (
                                        <div key={chat.id_chat} onClick={() => setSelectedChatId(chat.id_chat)}
                                            className={`chat-user-item ${chat.id_chat === selectedChatId ? "active" : ""}`}>
                                            <div className="chat-user-avatar">👥</div>
                                            <div className="chat-user-meta">
                                                <span
                                                    className="chat-user-title">{chat.group_name || "Группа"}
                                                    <div className="dropdown">
                                                        <button className='btn dropdown-btn' type="button"
                                                            data-bs-toggle="dropdown" aria-expanded="false">
                                                            <EllipsisVertical />
                                                        </button>
                                                        <ul className="dropdown-menu">
                                                            <li className="dropdown-item" onClick={(e) => { e.stopPropagation(); deleteChat(chat) }}>Удалить</li>
                                                            <li className="dropdown-item" onClick={(e) => { e.stopPropagation(); openDetailsModal() }}>Подробнее</li>
                                                        </ul>
                                                    </div>
                                                </span>
                                            </div>
                                        </div>);
                                }

                                // Для обычных чатов
                                const isUser1 = String(chat.id_user1) === String(user.id);
                                const chatPartnerName = isUser1 ? chat.name_user2 : chat.name_user1;
                                return (<div key={chat.id_chat} onClick={() => setSelectedChatId(chat.id_chat)}
                                    className={`chat-user-item ${chat.id_chat === selectedChatId ? "active" : ""}`}>
                                    <div
                                        className="chat-user-avatar">{chatPartnerName?.slice(0, 1) || "?"}</div>
                                    <div className="chat-user-meta">
                                        <span
                                            className="chat-user-title">{chatPartnerName || "Неизвестный"}</span>
                                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                                            <button className='btn dropdown-btn' type="button" data-bs-toggle="dropdown"
                                                aria-expanded="false">
                                                <EllipsisVertical />
                                            </button>
                                            <ul className="dropdown-menu">
                                                <li className="dropdown-item" onClick={(e) => { e.stopPropagation(); deleteChat(chat) }}>Удалить</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>);
                            })) : (<div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                <p>Нет активных чатов</p>
                                <small>Создайте новый чат, нажав "➕ Новый чат"</small>
                            </div>)}
                        </div>
                    </aside>

                    <section className="chat-window">
                        <div className="chat-messages">
                            {messages.map((msg) => (<div key={msg.id}
                                className={`message ${msg.from === "self" ? "user" : "support"}-message`}>
                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>{msg.text}</p>
                                        {msg.time && <span className="message-time" style={{
                                            fontSize: '11px', opacity: 0.6
                                        }}>{msg.time}</span>}
                                        {msg.from === "other" && selectedChatCombined?.group_name && (
                                            <div style={{
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: '#4fc3f7',
                                                marginBottom: '4px',
                                                marginLeft: '4px'
                                            }}>
                                                {msg.sender_name || 'Участник'}
                                            </div>)}
                                    </div>
                                    <div className="message-info" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        justifyContent: 'flex-end'
                                    }}>
                                        {msg.from === "self" && (<span className="read-status">
                                            {msg.isRead ? (<span title={`Просмотрено в ${msg.readTime}`}
                                                style={{
                                                    color: '#4fc3f7',
                                                    fontSize: '12px'
                                                }}>
                                                ✔✔ <small
                                                    style={{ fontSize: '10px' }}>{msg.readTime}</small>
                                            </span>) : (
                                                <span style={{ color: '#ccc', fontSize: '12px' }}>✔</span>)}
                                        </span>)}
                                    </div>
                                </div>
                            </div>))}
                        </div>

                        <div className="chat-input-area">
                            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder="Введите сообщение..." className="chat-input"
                                disabled={!selectedChatCombined} />
                            <button className="send-btn" onClick={sendMessage}
                                disabled={!selectedChatCombined || !message.trim()}>➤
                            </button>
                        </div>
                    </section>
                </div>
            </main>
        </div>

        {showNewChatModal && (<>
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
                        </div>))}
                </div>
            </div>
        </>)}

        {isGroupChat && (<>
            <div className="modal-overlay" onClick={() => {
                setIsGroupChat(false);
                setSelectedGroupUsers([]);
            }} />
            <div className="new-chat-modal">
                <div className="modal-header">
                    <h3>Создать групповой чат</h3>
                    <button className="close-modal" onClick={() => {
                        setIsGroupChat(false);
                        setSelectedGroupUsers([]);
                    }}>×
                    </button>
                </div>
                <div className='modal-group-name'>
                    <h3>Введите назваение группы</h3>
                    <input ref={groupName} type="text" className="group-name-input"
                        placeholder="Название группы" />
                </div>
                <div className="modal-users-list">
                    {allUsers.map((u) => (<div
                        key={u.id}
                        className="modal-user-item-checkbox"
                        onClick={() => {
                            setSelectedGroupUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={selectedGroupUsers.includes(u.id)}
                            onChange={() => {
                                setSelectedGroupUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                            }}
                            className="group-chat-checkbox"
                        />
                        <div className="modal-user-avatar">
                            {u.name?.slice(0, 1) || '?'}
                        </div>
                        <div className="modal-user-name">{u.name || 'Неизвестный'}</div>
                    </div>))}
                </div>
                <div className="modal-footer">
                    <button
                        className="cancel-btn"
                        onClick={() => {
                            setIsGroupChat(false);
                            setSelectedGroupUsers([]);
                        }}
                    >
                        Отмена
                    </button>
                    <button
                        className="create-group-btn"
                        onClick={() => createGroupChat(selectedGroupUsers)}
                        disabled={selectedGroupUsers.length === 0}
                    >
                        Создать группу ({selectedGroupUsers.length})
                    </button>
                </div>
            </div>
        </>)}
        <ModalDetailsChats
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            groupInfo={selectedChatCombined && selectedChatCombined.group_name ? selectedChatCombined : null}
            currentUserId={user.id}
            onRemoveUser={onRemoveUserFromGroup}
            onDeleteGroup={deleteChat}
        />
    </div>);
};

export default ChatUsers;