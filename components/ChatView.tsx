import React, { useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import Composer from './Composer';

interface ChatViewProps {
    openGroupInfo: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ openGroupInfo }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchActive, setIsSearchActive] = useState(false);

    return (
        <div className="flex-1 flex flex-col h-full">
            <ChatHeader 
                isSearchActive={isSearchActive}
                setIsSearchActive={setIsSearchActive}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                openGroupInfo={openGroupInfo}
            />
            <MessageList searchQuery={isSearchActive ? searchQuery : ''} />
            <Composer />
        </div>
    );
};

export default ChatView;