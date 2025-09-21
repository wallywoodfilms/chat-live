import React, { createContext, ReactNode } from 'react';
import { User, Message, AppNotification, Chat, Status, Group } from '../types';
import { useChatManager } from '../hooks/useChatManager';

interface ChatContextProps {
    currentUser: User | null;
    users: User[];
    friends: User[];
    friendRequests: User[];
    peopleYouMayKnow: User[];
    blockedUsers: User[];
    groups: Group[];
    chats: Chat;
    statuses: Status[];
    activeChat: User | Group | null;
    activeStatusUser: User | null;
    notifications: AppNotification[];
    typingStatus: { [chatId: string]: string | undefined };
    viewingUserProfile: User | null;
    searchHistory: { [chatId: string]: string[] };
    replyingTo: Message | null;
    setReplyingTo: (message: Message | null) => void;
    isCallActive: 'voice' | 'video' | null;
    login: (username: string, password: string) => boolean;
    register: (name: string, password: string, profilePicUrl: string) => boolean;
    logout: () => void;
    setActiveChatId: (id: string | null) => void;
    setActiveStatusUser: (user: User | null) => void;
    setViewingUserProfile: (user: User | null) => void;
    sendMessage: (text: string, file?: { name: string; url: string; type: 'image' | 'file' | 'voice' | 'sticker' }) => void;
    sendStatusReply: (status: Status, replyText: string) => void;
    addStatus: (file: File) => void;
    markStatusAsViewed: (statusId: string) => void;
    sendFriendRequest: (userId: string) => void;
    acceptFriendRequest: (userId: string) => void;
    declineFriendRequest: (userId: string) => void;
    createGroup: (name: string, profilePicUrl: string, memberIds: string[]) => void;
    updateUserSettings: (settings: { name?: string; profilePicUrl?: string; statusMessage?: string; newPassword?: string; currentPassword?: string }) => boolean;
    clearChatHistory: (chatId: string) => void;
    blockUser: (userId: string) => void;
    unblockUser: (userId: string) => void;
    pinChat: (chatId: string) => void;
    unpinChat: (chatId: string) => void;
    startCall: (type: 'voice' | 'video') => void;
    endCall: () => void;
    searchUsers: (query: string) => User[];
    addSearchTermToHistory: (chatId: string, term: string) => void;
    clearSearchHistory: (chatId: string) => void;
    dismissNotification: (id: string) => void;
    notifyTypingStart: (chatId: string, recipientId: string | null) => void;
    notifyTypingStop: (chatId: string, recipientId: string | null) => void;
    // Group Management
    updateGroupInfo: (groupId: string, details: { name?: string; profilePicUrl?: string; description?: string }) => void;
    addMemberToGroup: (groupId: string, userId: string) => void;
    removeMemberFromGroup: (groupId: string, userId: string) => void;
    promoteToAdmin: (groupId: string, userId: string) => void;
    demoteAdmin: (groupId: string, userId: string) => void;
    leaveGroup: (groupId: string) => void;
}

export const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const chatManager = useChatManager();

    return (
        <ChatContext.Provider value={chatManager}>
            {children}
        </ChatContext.Provider>
    );
};