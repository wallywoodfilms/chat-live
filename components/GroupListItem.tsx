import React, { useContext, useMemo, useState } from 'react';
import { Group } from '../types';
import { ChatContext } from '../context/ChatContext';
import ContextMenu from './ContextMenu';
import { PinIcon } from './icons/PinIcon';


interface GroupListItemProps {
    group: Group;
}

const GroupListItem: React.FC<GroupListItemProps> = ({ group }) => {
    const context = useContext(ChatContext);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

    if (!context) return null;

    const { activeChat, setActiveChatId, currentUser, chats, pinChat, unpinChat } = context;
    const isSelected = activeChat?.id === group.id;
    const isPinned = currentUser?.pinnedChatIds?.includes(group.id) ?? false;
    
    const unreadCount = useMemo(() => {
        if (!currentUser) return 0;
        const chatMessages = chats[group.id] || [];
        return chatMessages.filter(msg => msg.senderId !== currentUser.id && !msg.readBy.includes(currentUser.id)).length;
    }, [chats, currentUser, group.id]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY });
    };

     const menuOptions = [
        { label: isPinned ? 'Unpin Chat' : 'Pin Chat', action: () => isPinned ? unpinChat(group.id) : pinChat(group.id) }
    ];

    return (
        <div onContextMenu={handleContextMenu}>
            <div
                className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-wa-dark-lighter' : 'hover:bg-wa-dark-lighter/50'}`}
                onClick={() => setActiveChatId(group.id)}
            >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <img src={group.profilePicUrl} alt={group.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold truncate">{group.name}</p>
                            <div className="flex items-center space-x-2">
                                {isPinned && <PinIcon className="w-3.5 h-3.5 text-wa-text-secondary"/>}
                                {unreadCount > 0 && (
                                    <span className="bg-wa-green text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center ml-2 flex-shrink-0">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} options={menuOptions} onClose={() => setContextMenu(null)} />}
        </div>
    );
};

export default GroupListItem;