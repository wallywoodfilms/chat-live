import React from 'react';
import { User } from '../types';
import { XIcon } from './icons/XIcon';
import { formatLastSeen } from '../utils/time';

interface UserProfileModalProps {
    user: User;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="relative bg-wa-dark-light rounded-lg shadow-2xl flex flex-col items-center w-full max-w-sm m-4 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="w-full bg-wa-dark-lighter p-4 rounded-t-lg">
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 text-wa-text-secondary hover:text-wa-text rounded-full">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <img 
                                src={user.profilePicUrl} 
                                alt={`${user.name}'s profile`} 
                                className="w-32 h-32 object-cover rounded-full border-4 border-gray-600 shadow-lg"
                            />
                             <span className={`absolute bottom-1 right-1 block h-5 w-5 rounded-full ${user.lastSeen === 'online' ? 'bg-green-500' : 'bg-gray-500'} ring-4 ring-wa-dark-lighter`}></span>
                        </div>
                        <h2 className="text-2xl font-bold text-wa-text mt-4">{user.name}</h2>
                        <p className={`text-sm mt-1 ${user.lastSeen === 'online' ? 'text-wa-green' : 'text-wa-text-secondary'}`}>
                            {formatLastSeen(user.lastSeen)}
                        </p>
                    </div>
                </header>
                <div className="w-full p-6">
                    <h3 className="text-xs font-semibold text-wa-green tracking-wide uppercase">Status</h3>
                    <p className="text-wa-text mt-1 italic">
                        {user.statusMessage || "No status message."}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;