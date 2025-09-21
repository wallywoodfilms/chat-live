import React, { useState, useContext, useEffect } from 'react';
import { ChatContext } from '../context/ChatContext';
import { useImageUpload } from '../hooks/useImageUpload';
import { XIcon } from './icons/XIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { BellIcon } from './icons/BellIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { User } from '../types';


const ProfileSettings: React.FC = () => {
    const context = useContext(ChatContext);
    const { currentUser, updateUserSettings } = context!;

    const [name, setName] = useState(currentUser?.name || '');
    const [statusMessage, setStatusMessage] = useState(currentUser?.statusMessage || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { imageUrl, setImageUrl, handleFileChange, triggerFileInput, fileInputRef } = useImageUpload(currentUser?.profilePicUrl);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword && newPassword !== confirmNewPassword) {
            setError('New passwords do not match.');
            return;
        }

        const settingsToUpdate: { name?: string; profilePicUrl?: string; statusMessage?: string; newPassword?: string; currentPassword?: string } = {};

        if (name !== currentUser?.name) settingsToUpdate.name = name;
        if (imageUrl !== currentUser?.profilePicUrl) settingsToUpdate.profilePicUrl = imageUrl;
        if (statusMessage !== (currentUser?.statusMessage || '')) settingsToUpdate.statusMessage = statusMessage;
        if (newPassword) {
            settingsToUpdate.newPassword = newPassword;
            settingsToUpdate.currentPassword = currentPassword;
        }
        if (Object.keys(settingsToUpdate).length === 0) {
            setError("No changes to save.");
            return;
        }
        
        const wasSuccessful = updateUserSettings(settingsToUpdate);
        if (wasSuccessful) {
            setSuccess('Settings updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            setError('Failed to update settings. The username might be taken or your current password was incorrect.');
        }
    };
    
    const inputClasses = "w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-2 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-wa-green transition";

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
                <img src={imageUrl} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
                <div className="flex items-center space-x-2">
                    <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClasses + " flex-1 text-sm"} placeholder="Enter URL"/>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <button type="button" onClick={triggerFileInput} className="px-3 py-2 bg-wa-dark-lighter border border-gray-600 rounded-md hover:bg-gray-700 transition" aria-label="Upload image">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-wa-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                 {error && <p className="text-red-400 text-center text-sm -mt-2 mb-2">{error}</p>}
                 {success && <p className="text-green-400 text-center text-sm -mt-2 mb-2">{success}</p>}
                <div>
                    <label className="block text-xs font-medium text-wa-text-secondary mb-1">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-wa-text-secondary mb-1">Status Message</label>
                    <input type="text" value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)} placeholder="Set a status" className={inputClasses} />
                </div>
                <hr className="border-gray-700 !my-6" />
                <p className="text-sm text-wa-text-secondary">To change your password, enter your current and new password below.</p>
                <div>
                    <label className="block text-xs font-medium text-wa-text-secondary mb-1">Current Password</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClasses} placeholder="Required to change password" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-wa-text-secondary mb-1">New Password</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-wa-text-secondary mb-1">Confirm New Password</label>
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClasses} />
                </div>
                <button type="submit" className="w-full !mt-6 bg-indigo-600 text-white font-semibold py-2 rounded-md hover:bg-indigo-700 transition">
                    Save Changes
                </button>
            </form>
        </div>
    );
};

const NotificationSettings = () => {
    const [enabled, setEnabled] = useState(Notification.permission === 'granted');

    const handleToggle = async () => {
        if (Notification.permission === 'granted') {
           alert("Desktop notifications are already enabled. To disable them, please update your browser settings for this site.");
        } else if (Notification.permission === 'denied') {
            alert("Desktop notifications have been blocked. To enable them, please update your browser settings for this site.");
        } else {
             const permission = await Notification.requestPermission();
             setEnabled(permission === 'granted');
        }
    };
    
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-wa-text">Notification Settings</h3>
            <div className="bg-wa-dark-lighter p-4 rounded-lg flex items-center justify-between">
                <div>
                    <p className="font-medium">Desktop Notifications</p>
                    <p className="text-sm text-wa-text-secondary">Receive notifications for new messages when the app is in the background.</p>
                </div>
                <label htmlFor="desktop-notifications" className="flex items-center cursor-pointer">
                    <div className="relative">
                        <input id="desktop-notifications" type="checkbox" className="sr-only" checked={enabled} onChange={handleToggle} />
                        <div className={`block w-14 h-8 rounded-full ${enabled ? 'bg-indigo-600' : 'bg-gray-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${enabled ? 'transform translate-x-6' : ''}`}></div>
                    </div>
                </label>
            </div>
             <p className="text-xs text-wa-text-secondary p-2">
                If notifications are disabled, you may need to adjust your browser's site settings to re-enable them. This app does not store a list of past notifications. They appear in real-time and are not saved.
            </p>
        </div>
    );
};


const PrivacySettings = () => {
    const context = useContext(ChatContext);
    const { blockedUsers = [], unblockUser } = context!;

    return (
        <div className="space-y-6">
             <h3 className="text-lg font-semibold text-wa-text">Privacy Settings</h3>
            <div>
                <p className="font-medium mb-2">Blocked Users</p>
                <div className="bg-wa-dark-lighter p-2 rounded-lg max-h-40 overflow-y-auto">
                    {blockedUsers.length > 0 ? (
                        <ul className="divide-y divide-gray-700">
                            {blockedUsers.map(user => (
                                <li key={user.id} className="p-2 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <img src={user.profilePicUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                    <button onClick={() => unblockUser(user.id)} className="text-sm bg-indigo-600 px-3 py-1 rounded-md hover:bg-indigo-700">
                                        Unblock
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-sm text-wa-text-secondary py-4">You haven't blocked any users.</p>
                    )}
                </div>
            </div>
            <hr className="border-gray-700" />
            <div>
                <h4 className="font-medium mb-2">Privacy Policy</h4>
                <div className="text-sm text-wa-text-secondary space-y-3">
                    <p>Your privacy is important to us. This is a demo application and all data is stored locally in your browser's LocalStorage. No data is sent to or stored on any server.</p>
                    <p>
                        <strong>Data We "Collect":</strong> We store your user profile (name, status, profile picture), friend list, chat history, and group information directly in your browser. This information is never transmitted to a third party.
                    </p>
                    <p>
                        <strong>Data Usage:</strong> Your data is used solely to provide the chat functionality within this application. The BroadcastChannel API is used to sync data between different tabs of this app on the same device.
                    </p>
                     <p>
                        <strong>Security:</strong> Please be aware that storing data in LocalStorage is not suitable for sensitive information. Passwords are stored in plain text for demonstration purposes only. Do not use real passwords.
                    </p>
                    <p>
                        By using this application, you acknowledge and agree to these terms. Since this is a local-only demo, clearing your browser's cache will permanently delete all your data.
                    </p>
                </div>
            </div>
        </div>
    );
};

const AboutSettings = () => (
     <div className="space-y-6">
        <div className="text-center">
            <h3 className="text-lg font-semibold text-wa-text">About Live Chat</h3>
            <p className="text-wa-text-secondary">Version 1.0.0</p>
        </div>
        <div className="text-sm text-wa-text-secondary space-y-4">
             <p>
                <strong>Live Chat</strong> is a feature-rich, real-time messaging application designed as a demonstration of modern web technologies. It emulates the core functionalities of popular chat apps like WhatsApp, providing a seamless and responsive user experience.
            </p>
            <div>
                <h4 className="font-semibold text-wa-text mb-2">Key Features:</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li>Real-time 1-on-1 and group messaging.</li>
                    <li>Friend request and management system.</li>
                    <li>User profiles, statuses, and online presence.</li>
                    <li>Image, file, voice message, and sticker sharing.</li>
                    <li>Local-first data persistence using LocalStorage.</li>
                    <li>Cross-tab synchronization with BroadcastChannel.</li>
                </ul>
            </div>
            <div>
                 <h4 className="font-semibold text-wa-text mb-2">Disclaimer:</h4>
                 <p>This is a portfolio project and is not intended for production use. All user data is stored locally on your device and can be lost by clearing browser data. For security reasons, please do not use any personal or sensitive information.</p>
            </div>
        </div>
    </div>
);

const UserSettingsModal: React.FC<{onClose: () => void}> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch(activeTab) {
            case 'profile': return <ProfileSettings />;
            case 'notifications': return <NotificationSettings />;
            case 'privacy': return <PrivacySettings />;
            case 'about': return <AboutSettings />;
            default: return null;
        }
    };
    
    const NavItem: React.FC<{tabName: string; label: string; icon: React.ReactNode}> = ({tabName, label, icon}) => (
        <button 
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center space-x-3 w-full text-left p-3 rounded-md transition-colors text-sm ${activeTab === tabName ? 'bg-indigo-600 text-white' : 'text-wa-text-secondary hover:bg-wa-dark-lighter'}`}
        >
           {icon}
            <span className="hidden md:inline">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-wa-dark-light w-full max-w-4xl h-full max-h-[600px] rounded-lg shadow-2xl border border-gray-700 relative flex overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-wa-text-secondary hover:text-wa-text z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                
                {/* Left Navigation */}
                <aside className="bg-wa-dark w-16 md:w-56 p-4 border-r border-gray-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-wa-text mb-6 hidden md:block">Settings</h2>
                    <nav className="space-y-2">
                        <NavItem tabName="profile" label="Profile" icon={<UserCircleIcon className="w-5 h-5"/>} />
                        <NavItem tabName="notifications" label="Notifications" icon={<BellIcon className="w-5 h-5"/>} />
                        <NavItem tabName="privacy" label="Privacy" icon={<ShieldCheckIcon className="w-5 h-5"/>} />
                        <NavItem tabName="about" label="About" icon={<InformationCircleIcon className="w-5 h-5"/>} />
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default UserSettingsModal;