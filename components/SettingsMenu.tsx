import React, { useContext } from 'react';
import { User, Group } from '../types';
import { ChatContext } from '../context/ChatContext';

interface SettingsMenuProps {
    chat: User | Group;
    closeMenu: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ chat, closeMenu }) => {
    const context = useContext(ChatContext);
    if (!context) return null;

    const { clearChatHistory, blockUser } = context;
    const isGroup = 'members' in chat;

    const handleAction = (action: () => void) => {
        action();
        closeMenu();
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-48 bg-wa-dark-lighter rounded-md shadow-lg z-20 border border-gray-700">
            <ul className="py-1">
                <li>
                    <button 
                        onClick={() => {
                            if (window.confirm('Are you sure you want to clear this chat history? This action cannot be undone.')) {
                                handleAction(() => clearChatHistory(chat.id));
                            }
                        }} 
                        className="w-full text-left px-4 py-2 text-sm text-wa-text hover:bg-wa-dark-light/50"
                    >
                        Clear Chat
                    </button>
                </li>
                 {!isGroup && (
                    <li>
                        <button 
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to block ${chat.name}?`)) {
                                    handleAction(() => blockUser((chat as User).id));
                                }
                            }} 
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-wa-dark-light/50"
                        >
                            Block User
                        </button>
                    </li>
                 )}
            </ul>
        </div>
    );
};

export default SettingsMenu;
