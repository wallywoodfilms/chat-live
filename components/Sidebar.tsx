import React, { useState, useContext, useMemo, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import UserList from './UserList';
import GroupList from './GroupList';
import StatusListItem from './StatusListItem';
import { SearchIcon } from './icons/SearchIcon';
import { LogoIcon } from './icons/LogoIcon';
import { XIcon } from './icons/XIcon';
import { User } from '../types';
import { GearIcon } from './icons/GearIcon';
import { PlusIcon } from './icons/PlusIcon';
import UserSettingsModal from './UserSettingsModal';

interface SidebarProps {
    closeSidebar: () => void;
    openNewGroupModal: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar, openNewGroupModal }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const context = useContext(ChatContext);
    const statusFileInputRef = useRef<HTMLInputElement>(null);

    if (!context) return null;
    const { currentUser, friends, friendRequests, peopleYouMayKnow, groups, statuses, logout, searchUsers, sendFriendRequest, addStatus } = context;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchTerm(query);
        if (query.trim()) {
            setSearchResults(searchUsers(query));
        } else {
            setSearchResults([]);
        }
    };

    const handleAddFriend = (user: User) => {
        sendFriendRequest(user.id);
        setSearchTerm('');
        setSearchResults([]);
    }

    const handleStatusFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            addStatus(file);
        }
    };

    const friendsWithStatus = useMemo(() => {
        const userIdsWithStatus = new Set(statuses.map(s => s.userId));
        return friends.filter(friend => userIdsWithStatus.has(friend.id));
    }, [statuses, friends]);

    return (
        <div className="h-full flex flex-col bg-wa-dark-light border-r border-gray-700/50">
            {/* Header */}
            <header className="flex items-center justify-between p-3 border-b border-gray-700/50 flex-shrink-0">
                <div className="flex items-center space-x-3">
                    {currentUser && (
                         <img src={currentUser.profilePicUrl} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <span className="font-semibold">{currentUser?.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                     <button onClick={openNewGroupModal} className="p-2 text-wa-text-secondary hover:text-wa-text" title="New Group">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-wa-text-secondary hover:text-wa-text" title="Settings">
                        <GearIcon className="w-5 h-5" />
                    </button>
                    <button onClick={logout} className="text-sm text-wa-text-secondary hover:text-wa-text">Logout</button>
                     <button onClick={closeSidebar} className="p-2 md:hidden">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="p-3 flex-shrink-0 relative">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-wa-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search for people..."
                        className="w-full bg-wa-dark-lighter rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wa-green transition"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                {searchTerm && (
                     <div className="absolute top-full left-0 right-0 mt-1 bg-wa-dark-lighter rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {searchResults.length > 0 ? (
                             searchResults.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-wa-dark-lighter/50">
                                    <div className="flex items-center space-x-3">
                                        <img src={user.profilePicUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                                        <span>{user.name}</span>
                                    </div>
                                    <button onClick={() => handleAddFriend(user)} className="text-xs bg-indigo-600 px-2 py-1 rounded-md hover:bg-indigo-700">Add</button>
                                </div>
                             ))
                        ) : (
                            <div className="p-3 text-center text-wa-text-secondary text-sm">No users found.</div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {/* Status List */}
                <div className="p-3 border-b border-gray-700/50">
                    <h3 className="text-sm font-semibold text-wa-green tracking-wide uppercase mb-2">
                        Status
                    </h3>
                    <div className="space-y-1">
                        {currentUser && <StatusListItem user={currentUser} isMe={true} onAddClick={() => statusFileInputRef.current?.click()} />}
                        {friendsWithStatus.map(user => (
                            <StatusListItem key={user.id} user={user} />
                        ))}
                    </div>
                    <input type="file" ref={statusFileInputRef} className="hidden" accept="image/*,video/*" onChange={handleStatusFileChange} />
                </div>


                {/* Chat and User Lists */}
                <GroupList title="Groups" groups={groups} />
                <UserList title="Friend Requests" users={friendRequests} type="requests" />
                <UserList title="Friends" users={friends} type="friends" />
                <UserList title="People You May Know" users={peopleYouMayKnow} type="people" />
            </div>

             <footer className="p-3 text-center text-xs text-wa-text-secondary border-t border-gray-700/50 flex items-center justify-center space-x-2">
                <LogoIcon className="w-4 h-4 text-indigo-400"/>
                <span>Live Chat</span>
            </footer>
            {isSettingsOpen && <UserSettingsModal onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};

export default Sidebar;
