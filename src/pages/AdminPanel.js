import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/AdminPanel.css';

const SupportTab = ({ messages, selectedUserId, onSelectUser, replyText, onChangeReplyText, onSendReply, users }) => {
    const messagesArray = Array.isArray(messages) ? messages : [];
    const currentThread = messagesArray.filter(m => 
        (m.id_sender === selectedUserId && m.id_getter === 1) || 
        (m.id_sender === 1 && m.id_getter === selectedUserId)
    );

    return (
        <div className="admin-support-container">
            <aside className="user-list">
                <h3>Пользователи с сообщениями</h3>
                {users.length ? (
                    users.map(user => (
                        <div
                            key={user.id}
                            className={`user-item ${selectedUserId === user.id ? 'active' : ''}`}
                            onClick={() => onSelectUser(user.id)}
                        >
                            {user.name_sender || `Пользователь ${user.id}`}
                        </div>
                    ))
                ) : (
                    <p className="empty-state">Нет пользователей с сообщениями</p>
                )}
            </aside>

            <section className="support-thread">
                {selectedUserId ? (
                    <>
                        <div className="thread-messages">
                            {currentThread.length ? (
                                currentThread.map(m => (
                                    <div
                                        key={m.id_message ?? `${m.id_sender}-${m.created_at}`}
                                        className={`message-item ${m.fromAdmin ? 'from-admin' : 'from-user'}`}
                                    >
                                        <div className="message-header">
                                            <strong>{m.fromAdmin ? 'Админ' : m.name_sender || `Пользователь ${m.id_sender}`}</strong>
                                            <span className="message-date">{m.created_at ? new Date(m.created_at).toLocaleString('ru-RU') : ''}</span>
                                        </div>
                                        <p className="message-text">{m.text}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-state">Нет сообщений в диалоге</p>
                            )}
                        </div>

                        <div className="thread-input">
                            <input
                                type="text"
                                className="reply-input"
                                placeholder="Напишите ответ..."
                                value={replyText}
                                onChange={(e) => onChangeReplyText(e.target.value)}
                            />
                            <button className="action-button primary" onClick={onSendReply}>Отправить</button>
                        </div>
                    </>
                ) : (
                    <p className="empty-state">Выберите пользователя слева, чтобы начать диалог</p>
                )}
            </section>
        </div>
    );
};

const AdminPanel = () => {
    const [reply, setReply] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const postMessageSupportReply = async () => {
        if (!reply.trim() || !selectedUserId) return;
        
        try {
            const body = new URLSearchParams();
            body.append('id_sender', '1');
            body.append('id_getter', String(selectedUserId));
            body.append('name_sender', 'Support team');
            body.append('text', reply);
            
            const response = await axios.post('https://zhalalov2.su/backend-school/messages/support', body);
            if (response.status === 200) {
                setReply('');
                getMessagesSupport();
            } else {
                alert('Ошибка отправки сообщения');
            }
        } catch (error) {
            alert('Не удалось отправить сообщение. Проверьте консоль.');
        }
    }

    const getMessagesSupport = async () => {
        try {
            const response = await axios.get('https://zhalalov2.su/backend-school/messages/support?id_getter=1&id_sender=1');
            if (response.status === 200) {
                let messagesData = response.data;
                
                if (typeof messagesData === 'object' && !Array.isArray(messagesData)) {
                    if (messagesData.data && Array.isArray(messagesData.data)) {
                        messagesData = messagesData.data;
                    } else if (messagesData.messages && Array.isArray(messagesData.messages)) {
                        messagesData = messagesData.messages;
                    } else {
                        messagesData = Object.values(messagesData).find(val => Array.isArray(val)) || [];
                    }
                }
                
                if (!Array.isArray(messagesData)) {
                    messagesData = [];
                }
                
                setMessages(messagesData);
                
                const uniqueUsers = messagesData.reduce((acc, msg) => {
                    if (msg.id_sender !== 1 && !acc.find(u => u.id === msg.id_sender)) {
                        acc.push({ id: msg.id_sender, name_sender: msg.name_sender });
                    }
                    return acc;
                }, []);
                
                setUsers(uniqueUsers);
                
                if (uniqueUsers.length > 0) {
                    setSelectedUserId(uniqueUsers[0].id);
                }
            }
        } catch (error) {
        }
    }

    useEffect(() => {
        getMessagesSupport();
    }, []);

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <h2>Чат поддержки</h2>
            </header>
            <main className="admin-content">
                <div className="chat-section">
                    <SupportTab
                        messages={messages}
                        selectedUserId={selectedUserId}
                        onSelectUser={setSelectedUserId}
                        replyText={reply}
                        onChangeReplyText={setReply}
                        onSendReply={postMessageSupportReply}
                        users={users}
                    />
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;