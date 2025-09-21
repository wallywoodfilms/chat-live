import React, { useContext, useEffect, useRef, useMemo, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import MessageBubble from './MessageBubble';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface MessageListProps {
    searchQuery: string;
}

const MessageList: React.FC<MessageListProps> = ({ searchQuery }) => {
    const context = useContext(ChatContext);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    if (!context || !context.currentUser || !context.activeChat) return null;

    const { currentUser, activeChat, chats } = context;
    const chatId = activeChat.id;
    const messages = chats[chatId] || [];

    const displayedMessages = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) {
            return messages;
        }
        return messages.filter(msg => msg.text && msg.text.toLowerCase().includes(query));
    }, [messages, searchQuery]);

    useEffect(() => {
        // Instant scroll on new message or chat switch
        scrollToBottom('auto');
    }, [displayedMessages.length, activeChat.id]);
    
    useEffect(() => {
        const handleScroll = () => {
            const container = containerRef.current;
            if (container) {
                const { scrollTop, scrollHeight, clientHeight } = container;
                // Show button if user has scrolled up more than a screen height
                const isScrolledUp = (scrollHeight - scrollTop - clientHeight) > clientHeight;
                setShowScrollButton(isScrolledUp);
            }
        };

        const container = containerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="flex-1 relative">
            <div ref={containerRef} className="absolute inset-0 overflow-y-auto p-4">
                <div className="flex flex-col space-y-2">
                    {displayedMessages.length > 0 ? (
                        displayedMessages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} highlight={searchQuery} />
                        ))
                    ) : (
                        <div className="text-center text-wa-text-secondary mt-10">
                            {searchQuery ? 'No messages found.' : 'No messages yet. Start the conversation!'}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             {showScrollButton && (
                <button 
                    onClick={() => scrollToBottom()} 
                    className="absolute bottom-6 right-6 bg-wa-dark-lighter p-2 rounded-full shadow-lg text-wa-text-secondary hover:text-wa-text transition-transform duration-300 animate-fade-in"
                >
                    <ChevronDownIcon className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default MessageList;