import React from 'react';
import '../css/modalDetailsChats.css';
import {Trash2} from "lucide-react";

function ModalDetailsChats({isOpen, onClose, groupInfo, currentUserId, onRemoveUser, onDeleteGroup}) {
    if (!isOpen || !groupInfo) return null;

    const handleRemoveUser = (userId) => {
        if (window.confirm('Удалить этого участника из группы?')) {
            onRemoveUser(groupInfo.id_group, userId);
        }
    };

    const handleDeleteGroup = () => {
        if (window.confirm('Вы уверены, что хотите удалить эту группу? Это действие нельзя отменить.')) {
            onDeleteGroup(groupInfo);
            onClose();
        }
    };

    return (
        <>
            <div className="modal-overlay-details" onClick={onClose} />
            <div className="group-info-modal">
                <div className="modal-header-details">
                    <h3>
                        <span className="group-icon">👥</span>
                        {groupInfo.group_name || 'Группа'}
                    </h3>
                    <button className="close-modal-btn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <div className="group-info-content">
                    <div className="group-members">
                        <h4 className="members-title">
                            <span>👤</span> Участники группы
                        </h4>
                        <div className="members-list">
                            {groupInfo.users && groupInfo.users.length > 0 ? (
                                groupInfo.users.map((member) => {
                                    const isCurrentUser = String(member.id_user) === String(currentUserId);
                                    return (
                                        <div key={member.id_user} className="member-item">
                                            <div className="member-info">
                                                <div className="member-avatar">
                                                    {member.name_user?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div className="member-details">
                                                    <span className="member-name">
                                                        {member.name_user || 'Неизвестный'}
                                                        {isCurrentUser && <span className="you-badge">Вы</span>}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                className="remove-member-btn"
                                                onClick={() => handleRemoveUser(member.id_user)}
                                                title="Удалить участника"
                                                aria-label={`Удалить ${member.name_user}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="no-members">Нет участников в группе</p>
                            )}
                        </div>
                        <br/>
                        <span>Количество участников: {groupInfo.users.length}</span>
                    </div>

                    <div className="group-actions">
                        <button
                            className="btn-danger-group"
                            onClick={handleDeleteGroup}
                        >
                            <span>🗑️</span>
                            Удалить группу
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalDetailsChats;
