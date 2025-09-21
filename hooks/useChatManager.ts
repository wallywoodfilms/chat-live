import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Message, Chat, AppNotification, Status, Group } from '../types';
import { db, SearchHistory } from '../services/db';
import { BROADCAST_CHANNEL_NAME } from '../constants';

export const useChatManager = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [chats, setChats] = useState<Chat>({});
    const [statuses, setStatuses] = useState<Status[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activeStatusUser, setActiveStatusUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [typingStatus, setTypingStatus] = useState<{ [chatId: string]: string }>({});
    const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
    const [searchHistory, setSearchHistory] = useState<SearchHistory>({});
    const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState(Notification.permission === 'granted');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isCallActive, setIsCallActive] = useState<'voice' | 'video' | null>(null);
    
    const channel = useMemo(() => new BroadcastChannel(BROADCAST_CHANNEL_NAME), []);
    const typingTimeouts = useRef<{ [chatId: string]: ReturnType<typeof setTimeout> }>({});

    const refreshData = useCallback(() => {
        const allUsers = db.getUsers();
        setUsers(allUsers);
        const authedId = db.getAuthenticatedUserId();
        if (authedId) {
            const user = allUsers.find(u => u.id === authedId);
            setCurrentUser(user || null);
        } else {
            setCurrentUser(null);
        }
        setGroups(db.getGroups());
        setChats(db.getChats());
        setStatuses(db.getStatuses());
        setSearchHistory(db.getSearchHistory());
    }, []);

    const postBroadcast = (type: string, payload: object) => {
        try {
            channel.postMessage({ type, payload });
        } catch (e) {
            console.error('Failed to post broadcast message', e);
        }
    };

    const updateUserStatus = useCallback((userId: string, status: 'online' | number) => {
        const allUsers = db.getUsers();
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex > -1) {
            allUsers[userIndex].lastSeen = status;
            db.saveUsers(allUsers);
            postBroadcast('USER_STATUS_UPDATE', { userId, status });
            refreshData();
        }
    }, [refreshData]);


    useEffect(() => {
        refreshData();
        
        const handleMessage = (event: MessageEvent) => {
            const { type, payload } = event.data;
            const authedId = db.getAuthenticatedUserId();

            if (type !== 'USER_TYPING_START' && type !== 'USER_TYPING_STOP') {
                refreshData();
            }
            
            if(!authedId) return;

            if (type === 'FRIEND_REQUEST' && payload.recipientId === authedId) {
                 addNotification({ type: 'friend_request', message: `${payload.senderName} sent you a friend request.`, fromUserId: payload.senderId });
            }
            if (type === 'NEW_MESSAGE') {
                const isForMe = payload.isGroup ? payload.memberIds.includes(authedId) : payload.recipientId === authedId;
                if (isForMe && payload.senderId !== authedId && payload.chatId !== activeChatId) {
                    addNotification({ type: 'new_message', message: `New message from ${payload.senderName}`, fromUserId: payload.isGroup ? payload.chatId : payload.senderId });
                    
                    if (desktopNotificationsEnabled && document.visibilityState === 'hidden') {
                        new Notification('New Message', {
                            body: `From: ${payload.senderName}\n${payload.message.text}`,
                            icon: users.find(u => u.id === payload.senderId)?.profilePicUrl || ''
                        });
                    }
                }
            }
             if (type === 'MESSAGES_READ' && payload.chatId.includes(authedId)) {
                refreshData();
            }
            if (type === 'USER_TYPING_START') {
                 const amITheRecipient = payload.isGroup ? payload.memberIds.includes(authedId) && payload.senderId !== authedId : payload.recipientId === authedId;
                 if (amITheRecipient) {
                    setTypingStatus(prev => ({ ...prev, [payload.chatId]: payload.senderName }));
                    if (typingTimeouts.current[payload.chatId]) {
                        clearTimeout(typingTimeouts.current[payload.chatId]);
                    }
                    typingTimeouts.current[payload.chatId] = setTimeout(() => {
                        setTypingStatus(prev => {
                            const newState = { ...prev };
                            delete newState[payload.chatId];
                            return newState;
                        });
                    }, 3000);
                 }
            }
            if (type === 'USER_TYPING_STOP') {
                 const amITheRecipient = payload.isGroup ? payload.memberIds.includes(authedId) && payload.senderId !== authedId : payload.recipientId === authedId;
                 if(amITheRecipient) {
                    if (typingTimeouts.current[payload.chatId]) {
                        clearTimeout(typingTimeouts.current[payload.chatId]);
                    }
                    setTypingStatus(prev => {
                        const newState = { ...prev };
                        delete newState[payload.chatId];
                        return newState;
                    });
                }
            }
        };

        const handleVisibilityChange = () => {
            const authedId = db.getAuthenticatedUserId();
            if (!authedId) return;
            if (document.visibilityState === 'visible') {
                updateUserStatus(authedId, 'online');
            } else {
                updateUserStatus(authedId, Date.now());
            }
        };

        channel.addEventListener('message', handleMessage);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            channel.removeEventListener('message', handleMessage);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            Object.values(typingTimeouts.current).forEach(clearTimeout);
        };
    }, [refreshData, channel, activeChatId, updateUserStatus, desktopNotificationsEnabled, users]);
    
    useEffect(() => {
       return () => {
           channel.close();
       }
    }, [channel]);

    const login = (username: string, password: string): boolean => {
        const user = db.authenticateUser(username, password);
        if (user) {
            db.setAuthenticatedUserId(user.id);
            updateUserStatus(user.id, 'online');
            refreshData();
            return true;
        }
        return false;
    };

    const register = (name: string, password: string, profilePicUrl: string): boolean => {
        if (db.findUserByName(name)) {
            alert('Username is already taken.');
            return false;
        }
        const user = db.createUser(name, password, profilePicUrl);
        db.setAuthenticatedUserId(user.id);
        updateUserStatus(user.id, 'online');
        refreshData();
        return true;
    };

    const logout = () => {
        if (currentUser) {
            updateUserStatus(currentUser.id, Date.now());
        }
        db.setAuthenticatedUserId(null);
        setCurrentUser(null);
        setActiveChatId(null);
        refreshData();
    };

    const activeChat = useMemo(() => {
        if (!activeChatId) return null;
        const friend = users.find(u => u.id === activeChatId);
        if (friend) return friend;
        return groups.find(g => g.id === activeChatId) || null;
    }, [users, groups, activeChatId]);


    const sendSystemMessage = useCallback((chatId: string, text: string) => {
        const systemMessage: Message = {
            id: `sys-${Date.now()}`,
            senderId: 'system',
            text,
            timestamp: Date.now(),
            type: 'system',
            readBy: [],
        };
        const allChats = db.getChats();
        if (!allChats[chatId]) {
            allChats[chatId] = [];
        }
        allChats[chatId].push(systemMessage);
        db.saveChats(allChats);
    }, []);

    const sendMessage = (text: string, file?: { name: string; url: string; type: 'image' | 'file' | 'voice' | 'sticker' }) => {
        if (!currentUser || !activeChat) return;

        const senderForReply = users.find(u => u.id === replyingTo?.senderId);

        const message: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text,
            timestamp: Date.now(),
            type: file ? file.type : 'text',
            readBy: [currentUser.id],
            ...(file && { file: { name: file.name, url: file.url } }),
            ...(replyingTo && { replyTo: { messageId: replyingTo.id, senderName: senderForReply?.name || 'Unknown', text: replyingTo.text } }),
        };

        setReplyingTo(null);

        const chatId = activeChat.id;
        const updatedChats = { ...chats };
        if (!updatedChats[chatId]) {
            updatedChats[chatId] = [];
        }
        updatedChats[chatId].push(message);
        setChats(updatedChats);
        db.saveChats(updatedChats);

        const isGroup = 'members' in activeChat;
        postBroadcast('NEW_MESSAGE', { 
            chatId,
            message,
            recipientId: isGroup ? null : activeChat.id,
            memberIds: isGroup ? activeChat.members : null,
            senderId: currentUser.id,
            senderName: currentUser.name,
            isGroup
        });
    };

    const sendStatusReply = (status: Status, replyText: string) => {
        if (!currentUser) return;
        const statusOwner = users.find(u => u.id === status.userId);
        if (!statusOwner) return;

        const message: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: replyText,
            timestamp: Date.now(),
            type: 'status_reply',
            readBy: [currentUser.id],
            replyToStatus: {
                statusUrl: status.url,
                statusType: status.type,
                statusOwnerName: statusOwner.name,
            }
        };

        const chatId = status.userId; // DM with status owner
        const updatedChats = { ...chats };
        if (!updatedChats[chatId]) {
            updatedChats[chatId] = [];
        }
        updatedChats[chatId].push(message);
        setChats(updatedChats);
        db.saveChats(updatedChats);

        postBroadcast('NEW_MESSAGE', { 
            chatId,
            message,
            recipientId: chatId,
            memberIds: null,
            senderId: currentUser.id,
            senderName: currentUser.name,
            isGroup: false,
        });
    };

    const addStatus = (file: File) => {
        if (!currentUser) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const newStatus: Status = {
                    id: `status-${Date.now()}`,
                    userId: currentUser.id,
                    type: file.type.startsWith('video/') ? 'video' : 'image',
                    url: event.target.result as string,
                    timestamp: Date.now(),
                    viewedBy: [currentUser.id],
                };
    
                const allStatuses = db.getStatuses();
                db.saveStatuses([...allStatuses, newStatus]);
                refreshData();
                postBroadcast('STATUS_UPDATE', { userId: currentUser.id });
            }
        };
        reader.readAsDataURL(file);
    };

    const markStatusAsViewed = (statusId: string) => {
        if (!currentUser) return;
        const allStatuses = db.getStatuses();
        const statusIndex = allStatuses.findIndex(s => s.id === statusId);

        if (statusIndex > -1 && !allStatuses[statusIndex].viewedBy.includes(currentUser.id)) {
            allStatuses[statusIndex].viewedBy.push(currentUser.id);
            db.saveStatuses(allStatuses);
            refreshData();
            postBroadcast('STATUS_UPDATE', { userId: allStatuses[statusIndex].userId });
        }
    };
    
    const sendFriendRequest = (userId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const targetUserIndex = allUsers.findIndex(u => u.id === userId);
        if (targetUserIndex === -1) return;
        
        if (!allUsers[targetUserIndex].friendRequestIds.includes(currentUser.id)) {
            allUsers[targetUserIndex].friendRequestIds.push(currentUser.id);
        }

        db.saveUsers(allUsers);
        refreshData();
        postBroadcast('FRIEND_REQUEST', { recipientId: userId, senderId: currentUser.id, senderName: currentUser.name });
    };

    const acceptFriendRequest = (userId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const currentUserIndex = allUsers.findIndex(u => u.id === currentUser.id);
        const requesterUserIndex = allUsers.findIndex(u => u.id === userId);

        if (currentUserIndex === -1 || requesterUserIndex === -1) return;

        allUsers[currentUserIndex].friendRequestIds = allUsers[currentUserIndex].friendRequestIds.filter(id => id !== userId);
        
        if (!allUsers[currentUserIndex].friendIds.includes(userId)) {
            allUsers[currentUserIndex].friendIds.push(userId);
        }
        if (!allUsers[requesterUserIndex].friendIds.includes(currentUser.id)) {
            allUsers[requesterUserIndex].friendIds.push(currentUser.id);
        }
        
        db.saveUsers(allUsers);
        refreshData();
        postBroadcast('FRIEND_UPDATE', { userId1: currentUser.id, userId2: userId });
    };

    const declineFriendRequest = (userId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const currentUserIndex = allUsers.findIndex(u => u.id === currentUser.id);
        if (currentUserIndex === -1) return;

        allUsers[currentUserIndex].friendRequestIds = allUsers[currentUserIndex].friendRequestIds.filter(id => id !== userId);
        db.saveUsers(allUsers);
        refreshData();
        postBroadcast('FRIEND_UPDATE', { userId1: currentUser.id, userId2: userId });
    };
    
     const createGroup = (name: string, profilePicUrl: string, memberIds: string[]) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const newGroup: Group = {
            id: `group-${Date.now()}`,
            name,
            profilePicUrl: profilePicUrl || `https://picsum.photos/seed/${name.toLowerCase()}/200`,
            members: [...new Set([currentUser.id, ...memberIds])], // Ensure creator is a member and no duplicates
            admins: [currentUser.id],
            createdBy: currentUser.id,
            description: 'A new group'
        };
        db.saveGroups([...allGroups, newGroup]);
        sendSystemMessage(newGroup.id, `${currentUser.name} created the group "${name}".`);
        refreshData();
        postBroadcast('GROUP_UPDATE', { group: newGroup });
    };

    const updateUserSettings = (settings: { name?: string; profilePicUrl?: string; statusMessage?: string; newPassword?: string; currentPassword?: string }): boolean => {
        if (!currentUser) return false;
        
        if (settings.newPassword && (!settings.currentPassword || db.authenticateUser(currentUser.name, settings.currentPassword) === null)) {
            alert('Incorrect current password.');
            return false;
        }
        
        const allUsers = db.getUsers();
        const userIndex = allUsers.findIndex(u => u.id === currentUser.id);

        if (userIndex === -1) return false;

        if (settings.name && settings.name !== currentUser.name && db.findUserByName(settings.name)) {
            alert('This name is already taken.');
            return false;
        }

        const updatedUser = { ...allUsers[userIndex] };
        if (settings.name) updatedUser.name = settings.name;
        if (settings.profilePicUrl) updatedUser.profilePicUrl = settings.profilePicUrl;
        if (settings.statusMessage !== undefined) updatedUser.statusMessage = settings.statusMessage;
        if (settings.newPassword) updatedUser.password = settings.newPassword;

        allUsers[userIndex] = updatedUser;
        db.saveUsers(allUsers);
        refreshData();
        postBroadcast('USER_PROFILE_UPDATE', { userId: currentUser.id });
        return true;
    };
    
    const clearChatHistory = (chatId: string) => {
        if (!currentUser) return;
        const updatedChats = { ...chats };
        if (updatedChats[chatId]) {
            updatedChats[chatId] = [{
              id: `sys-${Date.now()}`,
              senderId: 'system',
              text: 'Chat history cleared.',
              timestamp: Date.now(),
              type: 'system',
              readBy: []
            }];
            setChats(updatedChats);
            db.saveChats(updatedChats);
            postBroadcast('CHAT_CLEARED', { chatId });
        }
    };

    const blockUser = (userId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const currentUserIndex = allUsers.findIndex(u => u.id === currentUser.id);

        if (currentUserIndex > -1) {
            const user = allUsers[currentUserIndex];
            // Remove from friends
            user.friendIds = user.friendIds.filter(id => id !== userId);
            // Add to blocked list
            if (!user.blockedUserIds.includes(userId)) {
                user.blockedUserIds.push(userId);
            }
            allUsers[currentUserIndex] = user;
        }

        // Also remove current user from the target user's friend list
        const targetUserIndex = allUsers.findIndex(u => u.id === userId);
        if (targetUserIndex > -1) {
            allUsers[targetUserIndex].friendIds = allUsers[targetUserIndex].friendIds.filter(id => id !== currentUser.id);
        }
        
        db.saveUsers(allUsers);
        if (activeChatId === userId) {
            setActiveChatId(null);
        }
        refreshData();
        postBroadcast('FRIEND_UPDATE', { userId1: currentUser.id, userId2: userId });
        alert("User blocked.");
    };

    const unblockUser = (userId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const currentUserIndex = allUsers.findIndex(u => u.id === currentUser.id);

        if (currentUserIndex > -1) {
            const user = allUsers[currentUserIndex];
            user.blockedUserIds = user.blockedUserIds.filter(id => id !== userId);
            allUsers[currentUserIndex] = user;
            db.saveUsers(allUsers);
            refreshData();
            postBroadcast('FRIEND_UPDATE', { userId1: currentUser.id, userId2: userId });
            alert("User unblocked.");
        }
    };

    const pinChat = (chatId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) return;

        const user = allUsers[userIndex];
        const pinned = user.pinnedChatIds || [];
        if (!pinned.includes(chatId)) {
            user.pinnedChatIds = [chatId, ...pinned];
            allUsers[userIndex] = user;
            db.saveUsers(allUsers);
            refreshData();
            postBroadcast('USER_PROFILE_UPDATE', { userId: currentUser.id });
        }
    };
    
    const unpinChat = (chatId: string) => {
        if (!currentUser) return;
        const allUsers = db.getUsers();
        const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex === -1) return;

        const user = allUsers[userIndex];
        if (user.pinnedChatIds) {
            user.pinnedChatIds = user.pinnedChatIds.filter(id => id !== chatId);
            allUsers[userIndex] = user;
            db.saveUsers(allUsers);
            refreshData();
            postBroadcast('USER_PROFILE_UPDATE', { userId: currentUser.id });
        }
    };

    const startCall = (type: 'voice' | 'video') => {
        if (!activeChat || 'members' in activeChat) return; // Only for 1-on-1 chats
        setIsCallActive(type);
    };

    const endCall = () => {
        if (!currentUser || !activeChat || !isCallActive) return;

        const message: Message = {
            id: `msg-${Date.now()}`,
            senderId: currentUser.id,
            text: `Call ended`,
            timestamp: Date.now(),
            type: 'call_info',
            readBy: [currentUser.id],
            callInfo: { type: isCallActive, ended: true }
        };

        const chatId = activeChat.id;
        const updatedChats = { ...chats };
        if (!updatedChats[chatId]) updatedChats[chatId] = [];
        updatedChats[chatId].push(message);
        db.saveChats(updatedChats);

        postBroadcast('NEW_MESSAGE', { 
            chatId,
            message,
            recipientId: activeChat.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            isGroup: false
        });

        setIsCallActive(null);
    };
    
    const searchUsers = (query: string): User[] => {
        if (!query) return [];
        const blockedIds = currentUser?.blockedUserIds || [];
        return users.filter(user => 
            user.name.toLowerCase().includes(query.toLowerCase()) && 
            user.id !== currentUser?.id &&
            !blockedIds.includes(user.id)
        );
    };

    const addSearchTermToHistory = (chatId: string, term: string) => {
        const allHistory = db.getSearchHistory();
        const chatHistory = allHistory[chatId] || [];
        const updatedHistory = [term, ...chatHistory.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
        allHistory[chatId] = updatedHistory;
        db.saveSearchHistory(allHistory);
        setSearchHistory(allHistory);
    };

    const clearSearchHistory = (chatId: string) => {
        const allHistory = db.getSearchHistory();
        delete allHistory[chatId];
        db.saveSearchHistory(allHistory);
        setSearchHistory(allHistory);
    };

    const addNotification = (notif: { type: 'friend_request' | 'new_message', message: string, fromUserId?: string }) => {
        const newNotification: AppNotification = {
            id: `notif-${Date.now()}`,
            timestamp: Date.now(),
            ...notif
        };
        setNotifications(prev => [newNotification, ...prev]);
        setTimeout(() => dismissNotification(newNotification.id), 5000);
    };

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const notifyTypingStart = (chatId: string, recipientId: string | null) => {
        if (!currentUser || !activeChat) return;
        const isGroup = 'members' in activeChat;
        postBroadcast('USER_TYPING_START', { 
            chatId, 
            senderId: currentUser.id, 
            senderName: currentUser.name,
            recipientId,
            memberIds: isGroup ? activeChat.members : null,
            isGroup
        });
    };

    const notifyTypingStop = (chatId: string, recipientId: string | null) => {
        if (!currentUser || !activeChat) return;
        const isGroup = 'members' in activeChat;
        postBroadcast('USER_TYPING_STOP', { 
            chatId, 
            senderId: currentUser.id,
            recipientId,
            memberIds: isGroup ? activeChat.members : null,
            isGroup
        });
    };

    const markMessagesAsRead = useCallback((chatId: string) => {
        if (!currentUser) return;
        const allChats = db.getChats();
        const chatMessages = allChats[chatId];
        if (!chatMessages) return;

        let updated = false;
        chatMessages.forEach(msg => {
            if (msg.senderId !== currentUser.id && !msg.readBy.includes(currentUser.id)) {
                msg.readBy.push(currentUser.id);
                updated = true;
            }
        });

        if (updated) {
            db.saveChats(allChats);
            refreshData();
            postBroadcast('MESSAGES_READ', { chatId, readerId: currentUser.id });
        }
    }, [currentUser, refreshData, postBroadcast]);

    useEffect(() => {
        if (currentUser && activeChatId) {
            markMessagesAsRead(activeChatId);
        }
    }, [activeChatId, currentUser, chats, markMessagesAsRead]);

    const sortChats = (chats: (User | Group)[]) => {
        const pinnedIds = currentUser?.pinnedChatIds || [];
        return [...chats].sort((a, b) => {
            const aIsPinned = pinnedIds.includes(a.id);
            const bIsPinned = pinnedIds.includes(b.id);
            if (aIsPinned && !bIsPinned) return -1;
            if (!aIsPinned && bIsPinned) return 1;
            return 0; // Keep original order for same-pinned-status items
        });
    };

    const friends = useMemo(() => {
        const filtered = users.filter(u => currentUser?.friendIds.includes(u.id) && !currentUser?.blockedUserIds?.includes(u.id));
        return sortChats(filtered) as User[];
    }, [users, currentUser]);

    const friendRequests = useMemo(() => users.filter(u => currentUser?.friendRequestIds.includes(u.id) && !currentUser?.blockedUserIds?.includes(u.id)), [users, currentUser]);
    const peopleYouMayKnow = useMemo(() => users.filter(u => u.id !== currentUser?.id && !currentUser?.friendIds.includes(u.id) && !currentUser?.friendRequestIds.includes(u.id) && !currentUser?.blockedUserIds?.includes(u.id)), [users, currentUser]);

    const myGroups = useMemo(() => {
        const filtered = groups.filter(g => currentUser && g.members.includes(currentUser.id));
        return sortChats(filtered) as Group[];
    }, [groups, currentUser]);
    
    const blockedUsers = useMemo(() => users.filter(u => currentUser?.blockedUserIds?.includes(u.id)), [users, currentUser]);


    // --- GROUP MANAGEMENT ---
    const updateGroupInfo = (groupId: string, details: { name?: string; profilePicUrl?: string; description?: string }) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const groupIndex = allGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;
        
        const group = allGroups[groupIndex];
        if (!group.admins.includes(currentUser.id)) {
            alert("Only admins can edit group info.");
            return;
        }

        if (details.name && details.name !== group.name) {
            sendSystemMessage(groupId, `${currentUser.name} changed the group name to "${details.name}".`);
            group.name = details.name;
        }
        if (details.profilePicUrl && details.profilePicUrl !== group.profilePicUrl) {
            sendSystemMessage(groupId, `${currentUser.name} changed the group icon.`);
            group.profilePicUrl = details.profilePicUrl;
        }
        if (details.description !== undefined && details.description !== group.description) {
            sendSystemMessage(groupId, `${currentUser.name} changed the group description.`);
            group.description = details.description;
        }
        
        db.saveGroups(allGroups);
        postBroadcast('GROUP_UPDATE', { groupId });
        refreshData();
    };

    const addMemberToGroup = (groupId: string, userId: string) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const groupIndex = allGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = allGroups[groupIndex];
        if (!group.admins.includes(currentUser.id)) {
            alert("Only admins can add members.");
            return;
        }
        if (group.members.includes(userId)) return;

        group.members.push(userId);
        db.saveGroups(allGroups);

        const newMember = users.find(u => u.id === userId);
        sendSystemMessage(groupId, `${currentUser.name} added ${newMember?.name || 'a new user'}.`);

        postBroadcast('GROUP_UPDATE', { groupId });
        refreshData();
    };
    
    const removeMemberFromGroup = (groupId: string, userId: string) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const groupIndex = allGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = allGroups[groupIndex];
        const userToRemove = users.find(u => u.id === userId);
        
        if (!group.admins.includes(currentUser.id)) {
            alert("Only admins can remove members.");
            return;
        }
        if (group.createdBy === userId) {
            alert("You cannot remove the group creator.");
            return;
        }

        group.members = group.members.filter(id => id !== userId);
        group.admins = group.admins.filter(id => id !== userId); // Also remove from admins if they are one
        db.saveGroups(allGroups);
        
        sendSystemMessage(groupId, `${currentUser.name} removed ${userToRemove?.name || 'a user'}.`);

        postBroadcast('GROUP_UPDATE', { groupId });
        refreshData();
    };

    const promoteToAdmin = (groupId: string, userId: string) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const groupIndex = allGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = allGroups[groupIndex];
        if (!group.admins.includes(currentUser.id)) {
            alert("Only admins can promote members.");
            return;
        }
        if (group.admins.includes(userId)) return;

        group.admins.push(userId);
        db.saveGroups(allGroups);
        
        const promotedUser = users.find(u => u.id === userId);
        sendSystemMessage(groupId, `${promotedUser?.name || 'A user'} was promoted to admin.`);

        postBroadcast('GROUP_UPDATE', { groupId });
        refreshData();
    };

    const demoteAdmin = (groupId: string, userId: string) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const groupIndex = allGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = allGroups[groupIndex];
        if (!group.admins.includes(currentUser.id)) {
            alert("Only admins can demote other admins.");
            return;
        }
         if (group.createdBy === userId) {
            alert("The group creator cannot be demoted.");
            return;
        }

        group.admins = group.admins.filter(id => id !== userId);
        db.saveGroups(allGroups);

        const demotedUser = users.find(u => u.id === userId);
        sendSystemMessage(groupId, `${demotedUser?.name || 'An admin'} is no longer an admin.`);

        postBroadcast('GROUP_UPDATE', { groupId });
        refreshData();
    };

    const leaveGroup = (groupId: string) => {
        if (!currentUser) return;
        const allGroups = db.getGroups();
        const groupIndex = allGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const group = allGroups[groupIndex];
        if (group.createdBy === currentUser.id && group.members.length > 1) {
            alert("As the group creator, you must make someone else an admin before leaving.");
            if (group.admins.length < 2) {
                 alert("Please promote another member to admin first.");
                 return;
            }
        }

        group.members = group.members.filter(id => id !== currentUser.id);
        group.admins = group.admins.filter(id => id !== currentUser.id);

        sendSystemMessage(groupId, `${currentUser.name} left the group.`);

        if (group.members.length === 0) {
            // Delete group if last member leaves
            db.saveGroups(allGroups.filter(g => g.id !== groupId));
        } else {
             // If creator leaves, and they were the only admin, promote the first member
            if (group.createdBy === currentUser.id && group.admins.length === 0 && group.members.length > 0) {
                group.admins.push(group.members[0]);
                const newAdmin = users.find(u => u.id === group.members[0]);
                sendSystemMessage(groupId, `${newAdmin?.name} is now an admin.`);
            }
            db.saveGroups(allGroups);
        }

        if(activeChatId === groupId) setActiveChatId(null);
        postBroadcast('GROUP_UPDATE', { groupId });
        refreshData();
    };


    return {
        currentUser,
        users,
        friends,
        friendRequests,
        peopleYouMayKnow,
        blockedUsers,
        groups: myGroups,
        chats,
        statuses,
        activeChat,
        activeStatusUser,
        notifications,
        typingStatus,
        viewingUserProfile,
        searchHistory,
        replyingTo,
        setReplyingTo,
        isCallActive,
        login,
        register,
        logout,
        setActiveChatId,
        setActiveStatusUser,
        setViewingUserProfile,
        sendMessage,
        sendStatusReply,
        addStatus,
        markStatusAsViewed,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        createGroup,
        updateUserSettings,
        clearChatHistory,
        blockUser,
        unblockUser,
        pinChat,
        unpinChat,
        startCall,
        endCall,
        searchUsers,
        addSearchTermToHistory,
        clearSearchHistory,
        dismissNotification,
        notifyTypingStart,
        notifyTypingStop,
        // Group Management
        updateGroupInfo,
        addMemberToGroup,
        removeMemberFromGroup,
        promoteToAdmin,
        demoteAdmin,
        leaveGroup,
    };
};