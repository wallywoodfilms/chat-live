import React, { useContext, useMemo } from 'react';
import { User } from '../types';
import { ChatContext } from '../context/ChatContext';
import { StatusPlusIcon } from './icons/StatusPlusIcon';

interface StatusListItemProps {
    user: User;
    isMe?: boolean;
    onAddClick?: () => void;
}

const StatusListItem: React.FC<StatusListItemProps> = ({ user, isMe = false, onAddClick }) => {
    const context = useContext(ChatContext);
    if (!context) return null;

    const { currentUser, statuses, setActiveStatusUser } = context;

    const userStatuses = useMemo(() => {
        return statuses.filter(s => s.userId === user.id);
    }, [statuses, user.id]);

    const unreadCount = useMemo(() => {
        if (!currentUser) return 0;
        return userStatuses.filter(s => !s.viewedBy.includes(currentUser.id)).length;
    }, [userStatuses, currentUser]);
    
    const ringColor = unreadCount > 0 ? 'ring-wa-green' : 'ring-gray-500';

    if (isMe) {
        return (
            <div
                className="flex items-center p-2 rounded-lg transition-colors hover:bg-wa-dark-lighter/50 cursor-pointer"
                onClick={onAddClick}
            >
                <div className="relative flex-shrink-0">
                    <img src={user.profilePicUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-wa-green rounded-full p-0.5 border-2 border-wa-dark-light">
                        <StatusPlusIcon className="w-3 h-3 text-white" />
                    </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                    <p className="font-semibold truncate">My Status</p>
                    <p className="text-xs text-wa-text-secondary truncate">Tap to add status update</p>
                </div>
            </div>
        )
    }

    if (userStatuses.length === 0) return null;

    return (
        <div
            className="flex items-center p-2 rounded-lg transition-colors hover:bg-wa-dark-lighter/50 cursor-pointer"
            onClick={() => setActiveStatusUser(user)}
        >
            <div className={`relative p-0.5 rounded-full ring-2 ${ringColor}`}>
                <img src={user.profilePicUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                {unreadCount > 0 && (
                    <span className="absolute bottom-0 right-0 bg-wa-green text-white text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center border-2 border-wa-dark-light">
                        {unreadCount}
                    </span>
                )}
            </div>
            <div className="ml-3 min-w-0 flex-1">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-xs text-wa-text-secondary truncate">{unreadCount > 0 ? `${unreadCount} new update${unreadCount > 1 ? 's' : ''}` : 'Viewed'}</p>
            </div>
        </div>
    );
};

export default StatusListItem;