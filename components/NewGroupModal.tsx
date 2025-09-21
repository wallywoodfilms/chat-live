import React, { useState, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { useImageUpload } from '../hooks/useImageUpload';
import { XIcon } from './icons/XIcon';
import { User } from '../types';

interface NewGroupModalProps {
    onClose: () => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ onClose }) => {
    const context = useContext(ChatContext);
    const { friends, createGroup } = context!;

    const [groupName, setGroupName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const [error, setError] = useState('');

    const { imageUrl, setImageUrl, handleFileChange, triggerFileInput, fileInputRef } = useImageUpload();

    const handleToggleFriend = (friendId: string) => {
        setSelectedFriends(prev => 
            prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupName.trim()) {
            setError('Group name is required.');
            return;
        }
        if (selectedFriends.length === 0) {
            setError('You must select at least one friend.');
            return;
        }
        
        createGroup(groupName, imageUrl, selectedFriends);
        onClose();
    };

    const inputClasses = "w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-wa-green transition";

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-wa-dark-light w-full max-w-md rounded-lg shadow-2xl border border-gray-700 relative flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-wa-text-secondary hover:text-wa-text">
                        <XIcon className="w-6 h-6" />
                    </button>
                    <h2 className="text-2xl font-bold text-wa-text">Create New Group</h2>
                </header>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        {error && <p className="text-red-400 text-center text-sm">{error}</p>}
                        
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                 <img src={imageUrl || 'https://picsum.photos/seed/group-placeholder/200'} alt="Group" className="w-20 h-20 rounded-full object-cover border-2 border-gray-600" />
                                <button type="button" onClick={triggerFileInput} className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full hover:bg-indigo-700 transition">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                                </button>
                                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-wa-text-secondary mb-1">Group Name</label>
                                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className={inputClasses} placeholder="Enter group name"/>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-wa-text-secondary mb-2">Select Friends</label>
                            <div className="max-h-60 overflow-y-auto bg-wa-dark-lighter rounded-md p-2 space-y-2">
                                {friends.length > 0 ? friends.map(friend => (
                                    <div key={friend.id} onClick={() => handleToggleFriend(friend.id)} className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-wa-dark-light">
                                        <div className="flex items-center space-x-3">
                                            <img src={friend.profilePicUrl} alt={friend.name} className="w-10 h-10 rounded-full" />
                                            <span>{friend.name}</span>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 ${selectedFriends.includes(friend.id) ? 'bg-indigo-600 border-indigo-500' : 'border-gray-500'} flex items-center justify-center`}>
                                            {selectedFriends.includes(friend.id) && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-wa-text-secondary text-sm p-4">You have no friends to add.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                         <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition duration-300">
                            Create Group
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default NewGroupModal;
