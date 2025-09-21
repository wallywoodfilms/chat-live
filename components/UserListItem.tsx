import React, { useContext, useMemo, useState } from 'react';
import { User } from '../types';
import { ChatContext } from '../context/ChatContext';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { PinIcon } from './icons/PinIcon';
import { formatLastSeen } from '../utils/time';
import ContextMenu from './ContextMenu';

interface UserListItemProps {
    user: User;
    type: 'friends' | 'requests' | 'people';
}

const UserListItem: React.FC<UserListItemProps> = ({ user, type }) => {
    const context = useContext(ChatContext);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    if (!context) return null;

    const { activeChat, setActiveChatId, sendFriendRequest, acceptFriendRequest, declineFriendRequest, setViewingUserProfile, currentUser, chats, pinChat, unpinChat } = context;

    const isSelected = activeChat?.id === user.id;
    const isPinned = currentUser?.pinnedChatIds?.includes(user.id) ?? false;

    const unreadCount = useMemo(() => {
        if (type !== 'friends' || !currentUser) return 0;
        const chatId = user.id;
        const chatMessages = chats[chatId] || [];
        return chatMessages.filter(msg => msg.senderId === user.id && !msg.readBy.includes(currentUser.id)).length;
    }, [chats, currentUser, user.id, type]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY });
    };

    const menuOptions = [
        { label: isPinned ? 'Unpin Chat' : 'Pin Chat', action: () => isPinned ? unpinChat(user.id) : pinChat(user.id) }
    ];

    const renderActions = () => {
        switch (type) {
            case 'requests':
                return (
                    <div className="flex space-x-2">
                        <button onClick={() => acceptFriendRequest(user.id)} className="p-1.5 bg-green-500 rounded-full hover:bg-green-600 transition">
                            <CheckIcon className="w-4 h-4 text-white" />
                        </button>
                        <button onClick={() => declineFriendRequest(user.id)} className="p-1.5 bg-red-500 rounded-full hover:bg-red-600 transition">
                            <XIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>
                );
            case 'people':
                return (
                    <button onClick={() => sendFriendRequest(user.id)} className="p-1.5 bg-indigo-600 rounded-full hover:bg-indigo-700 transition">
                        <UserPlusIcon className="w-4 h-4 text-white" />
                    </button>
                );
            default:
                return null;
        }
    };
    
    const subText = user.statusMessage 
        ? <p className="text-xs text-wa-text-secondary italic truncate">"{user.statusMessage}"</p>
        : <p className={`text-xs ${user.lastSeen === 'online' ? 'text-wa-green' : 'text-wa-text-secondary'}`}>{formatLastSeen(user.lastSeen)}</p>;

    return (
        <div onContextMenu={type === 'friends' ? handleContextMenu : undefined}>
            <div
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isSelected ? 'bg-wa-dark-lighter' : 'hover:bg-wa-dark-lighter/50'}`}
            >
                <div className="flex items-center space-x-3 flex-1 min-w-0"
                    onClick={type === 'friends' ? () => setActiveChatId(user.id) : undefined}
                    style={{ cursor: type === 'friends' ? 'pointer' : 'default' }}
                >
                    <button onClick={(e) => { e.stopPropagation(); setViewingUserProfile(user); }} className="relative flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wa-dark-light focus:ring-wa-green">
                        <img src={user.profilePicUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        {type === 'friends' && (
                            <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${user.lastSeen === 'online' ? 'bg-green-500' : 'bg-gray-500'} ring-2 ring-wa-dark-lighter`}></span>
                        )}
                    </button>
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold truncate">{user.name}</p>
                            <div className="flex items-center space-x-2">
                                {isPinned && <PinIcon className="w-3.5 h-3.5 text-wa-text-secondary"/>}
                                {type === 'friends' && unreadCount > 0 && (
                                    <span className="bg-wa-green text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center flex-shrink-0">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                        {type === 'friends' && subText}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    {renderActions()}
                </div>
            </div>
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} options={menuOptions} onClose={() => setContextMenu(null)} />}
        </div>
    );
};

export default UserListItem;