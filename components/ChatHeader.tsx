import React, { useContext, useState, useMemo, useRef } from 'react';
import { ChatContext } from '../context/ChatContext';
import { User } from '../types';
import { SettingsIcon } from './icons/SettingsIcon';
import SettingsMenu from './SettingsMenu';
import { formatLastSeen } from '../utils/time';
import { SearchIcon } from './icons/SearchIcon';
import { XIcon } from './icons/XIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';

interface ChatHeaderProps {
    isSearchActive: boolean;
    setIsSearchActive: (isActive: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    openGroupInfo: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isSearchActive, setIsSearchActive, searchQuery, setSearchQuery, openGroupInfo }) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const context = useContext(ChatContext);
    const searchInputRef = useRef<HTMLInputElement>(null);

    if (!context || !context.activeChat || !context.currentUser) return null;
    
    const { activeChat, currentUser, typingStatus, setViewingUserProfile, users, searchHistory, addSearchTermToHistory, clearSearchHistory, startCall } = context;
    const isGroup = 'members' in activeChat;
    const friend = isGroup ? null : activeChat as User;

    const chatId = activeChat.id;
    const typingUser = typingStatus[chatId];
    const currentChatHistory = searchHistory[chatId] || [];
    
    const groupMembers = useMemo(() => {
        if (!isGroup) return [];
        return activeChat.members.map(memberId => users.find(u => u.id === memberId)?.name).filter(Boolean).join(', ');
    }, [activeChat, users, isGroup]);

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            addSearchTermToHistory(chatId, searchQuery.trim());
            searchInputRef.current?.blur();
        }
    };

    const renderTitle = () => {
        if (isGroup) {
            return (
                <button onClick={openGroupInfo} className="flex items-center space-x-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-wa-dark-lighter flex items-center justify-center">
                         <img src={activeChat.profilePicUrl} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                    </div>
                    <div>
                        <p className="font-semibold">{activeChat.name}</p>
                        {typingUser ? (
                             <p className="text-xs text-wa-green italic animate-pulse">{typingUser} is typing...</p>
                        ) : (
                             <p className="text-xs text-wa-text-secondary truncate max-w-xs">{groupMembers}</p>
                        )}
                    </div>
                </button>
            );
        }
        if (friend) {
            return (
                <div className="flex items-center space-x-3">
                    <button onClick={() => setViewingUserProfile(friend)} className="relative rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-wa-dark-light focus:ring-wa-green">
                        <img src={friend.profilePicUrl} alt={friend.name} className="w-10 h-10 rounded-full object-cover" />
                        <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ${friend.lastSeen === 'online' ? 'bg-green-500' : 'bg-gray-500'} ring-2 ring-wa-dark-light`}></span>
                    </button>
                    <div>
                        <p className="font-semibold">{friend.name}</p>
                        {typingUser ? (
                            <p className="text-xs text-wa-green italic animate-pulse">typing...</p>
                        ) : (
                            <p className="text-xs text-wa-text-secondary">{formatLastSeen(friend.lastSeen)}</p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    }

    return (
        <header className="flex items-center justify-between p-3 bg-wa-dark-light shadow-md flex-shrink-0 relative z-10">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
                {!isSearchActive ? (
                    renderTitle()
                ) : (
                    <div className="w-full flex items-center bg-wa-dark-lighter rounded-lg px-2 relative">
                        <SearchIcon className="w-5 h-5 text-wa-text-secondary flex-shrink-0" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search messages..."
                            className="w-full bg-transparent p-2 text-sm focus:outline-none text-wa-text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsHistoryVisible(true)}
                            onBlur={() => setTimeout(() => setIsHistoryVisible(false), 200)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                            autoFocus
                        />
                         {isHistoryVisible && currentChatHistory.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-wa-dark-lighter rounded-md shadow-lg border border-gray-700 py-1">
                                <div className="flex justify-between items-center px-3 py-1 mb-1 border-b border-gray-700">
                                    <span className="text-xs font-semibold text-wa-text-secondary">Recent Searches</span>
                                    <button onClick={() => clearSearchHistory(chatId)} className="text-xs text-indigo-400 hover:underline flex items-center space-x-1">
                                        <TrashIcon className="w-3 h-3"/>
                                        <span>Clear</span>
                                    </button>
                                </div>
                                {currentChatHistory.map(term => (
                                    <button
                                        key={term}
                                        className="w-full text-left px-3 py-1.5 text-sm text-wa-text hover:bg-wa-dark-light/50"
                                        onClick={() => {
                                            setSearchQuery(term);
                                            addSearchTermToHistory(chatId, term);
                                        }}
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex items-center space-x-1">
                 {!isGroup && (
                    <>
                        <button onClick={() => startCall('video')} className="p-2 text-wa-text-secondary hover:text-wa-text">
                            <VideoCameraIcon className="w-6 h-6" />
                        </button>
                        <button onClick={() => startCall('voice')} className="p-2 text-wa-text-secondary hover:text-wa-text">
                            <PhoneIcon className="w-5 h-5" />
                        </button>
                    </>
                )}
                <button onClick={() => { setIsSearchActive(!isSearchActive); setSearchQuery(''); }} className="p-2 text-wa-text-secondary hover:text-wa-text">
                    {isSearchActive ? <XIcon className="w-6 h-6" /> : <SearchIcon className="w-5 h-5" />}
                </button>
                <div className="relative">
                    <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 text-wa-text-secondary hover:text-wa-text">
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                    {isSettingsOpen && <SettingsMenu chat={activeChat} closeMenu={() => setIsSettingsOpen(false)} />}
                </div>
            </div>
        </header>
    );
};

export default ChatHeader;