import React, { useState, useContext } from 'react';
import { ChatProvider, ChatContext } from './context/ChatContext';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import UserProfileModal from './components/UserProfileModal';
import StatusViewer from './components/StatusViewer';
import NewGroupModal from './components/NewGroupModal';
import CallModal from './components/CallModal';
import { MenuIcon } from './components/icons/MenuIcon';
import { LogoIcon } from './components/icons/LogoIcon';
import GroupInfoModal from './components/GroupInfoModal';
import { Group } from './types';

const AppContent: React.FC = () => {
    const context = useContext(ChatContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);


    if (!context) return null;
    const { currentUser, activeChat, viewingUserProfile, setViewingUserProfile, activeStatusUser, setActiveStatusUser, isCallActive } = context;

    if (!currentUser) {
        return <AuthModal />;
    }
    
    const activeGroup = activeChat && 'members' in activeChat ? activeChat as Group : null;

    return (
        <div className="h-screen w-screen text-wa-text antialiased overflow-hidden">
            <div className="flex h-full">
                {/* Mobile Header */}
                <div className="md:hidden fixed top-0 left-0 right-0 bg-wa-dark-light z-20 flex items-center justify-between p-2 shadow-md">
                    <div className="flex items-center space-x-2">
                        <LogoIcon className="w-8 h-8 text-indigo-400" />
                        <h1 className="text-xl font-bold">Live Chat</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Sidebar */}
                <div className={`
                    fixed top-0 left-0 h-full w-full max-w-sm z-30
                    transform transition-transform duration-300 ease-in-out
                    md:relative md:w-1/3 md:max-w-md md:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}>
                    <Sidebar 
                        closeSidebar={() => setIsSidebarOpen(false)} 
                        openNewGroupModal={() => setIsNewGroupModalOpen(true)}
                    />
                </div>
                
                {/* Overlay for mobile */}
                {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-20 md:hidden" />}

                {/* Chat View */}
                <main className="flex-1 flex flex-col bg-wa-dark bg-cover bg-center mt-14 md:mt-0" style={{ backgroundImage: "url('https://i.pinimg.com/originals/85/ec/df/85ecdf1c361109f7955d93b450b559d2.jpg')" }}>
                    {activeChat ? (
                        <ChatView openGroupInfo={() => setIsGroupInfoModalOpen(true)} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <LogoIcon className="w-24 h-24 text-indigo-400/50" />
                            <h2 className="mt-4 text-2xl font-semibold text-wa-text">Welcome to Live Chat</h2>
                            <p className="text-wa-text-secondary mt-2">Select a friend or group to start chatting.</p>
                        </div>
                    )}
                </main>
            </div>
            {viewingUserProfile && <UserProfileModal user={viewingUserProfile} onClose={() => setViewingUserProfile(null)} />}
            {activeStatusUser && <StatusViewer user={activeStatusUser} onClose={() => setActiveStatusUser(null)} />}
            {isNewGroupModalOpen && <NewGroupModal onClose={() => setIsNewGroupModalOpen(false)} />}
            {isGroupInfoModalOpen && activeGroup && <GroupInfoModal group={activeGroup} onClose={() => setIsGroupInfoModalOpen(false)} />}
            {isCallActive && <CallModal />}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ChatProvider>
            <AppContent />
        </ChatProvider>
    );
};

export default App;