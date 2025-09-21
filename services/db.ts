import { User, Chat, Status, Group } from '../types';
import { DB_USERS_KEY, DB_CHATS_KEY, AUTH_USER_ID_KEY, DB_STATUS_KEY, DB_GROUPS_KEY, DB_SEARCH_HISTORY_KEY } from '../constants';

export type SearchHistory = { [chatId: string]: string[] };

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = <T,>(key: string, value: T): void => {
    try {
        const item = JSON.stringify(value);
        window.localStorage.setItem(key, item);
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

const seedInitialUsers = (): User[] => {
    // WARNING: Storing plain text passwords is not secure. This is for demonstration purposes only.
    const initialUsers: User[] = [
        { id: 'user-1', name: 'Alice', password: 'password', profilePicUrl: 'https://picsum.photos/seed/alice/200', lastSeen: 'online', statusMessage: "Hey there! I am using Live Chat.", friendIds: ['user-2'], friendRequestIds: [], blockedUserIds: [], pinnedChatIds: [] },
        { id: 'user-2', name: 'Bob', password: 'password', profilePicUrl: 'https://picsum.photos/seed/bob/200', lastSeen: Date.now() - 1000 * 60 * 5, statusMessage: "At the gym.", friendIds: ['user-1'], friendRequestIds: [], blockedUserIds: [], pinnedChatIds: [] },
        { id: 'user-3', name: 'Charlie', password: 'password', profilePicUrl: 'https://picsum.photos/seed/charlie/200', lastSeen: 'online', statusMessage: "Coding away...", friendIds: [], friendRequestIds: [], blockedUserIds: [], pinnedChatIds: [] },
        { id: 'user-4', name: 'Diana', password: 'password', profilePicUrl: 'https://picsum.photos/seed/diana/200', lastSeen: Date.now() - 1000 * 60 * 60 * 24, statusMessage: "On vacation!", friendIds: [], friendRequestIds: [], blockedUserIds: [], pinnedChatIds: [] },
    ];
    saveToStorage(DB_USERS_KEY, initialUsers);
    return initialUsers;
};

const seedInitialGroups = (): Group[] => {
    const initialGroups: Group[] = [
        {
            id: 'group-1',
            name: 'Weekend Coders',
            profilePicUrl: 'https://picsum.photos/seed/coders/200',
            description: 'A group for passionate developers to discuss projects, share ideas, and collaborate on weekend hacks. All skill levels welcome!',
            members: ['user-1', 'user-2', 'user-3'],
            admins: ['user-1'],
            createdBy: 'user-1'
        }
    ];
    saveToStorage(DB_GROUPS_KEY, initialGroups);
    return initialGroups;
}

const seedInitialStatuses = (): Status[] => {
    const initialStatuses: Status[] = [
        {
            id: `status-${Date.now() - 10000}`,
            userId: 'user-2',
            type: 'image',
            url: 'https://picsum.photos/seed/bob-status/1080/1920',
            timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
            viewedBy: [],
        },
        {
            id: `status-${Date.now() - 20000}`,
            userId: 'user-2',
            type: 'image',
            url: 'https://picsum.photos/seed/bob-status-2/1080/1920',
            timestamp: Date.now() - 1000 * 60 * 35, // 35 minutes ago
            viewedBy: [],
        },
    ];
    saveToStorage(DB_STATUS_KEY, initialStatuses);
    return initialStatuses;
}

export const db = {
    getUsers: (): User[] => {
        const users = getFromStorage<User[]>(DB_USERS_KEY, []);
        if (users.length === 0) {
            return seedInitialUsers();
        }
        return users;
    },
    saveUsers: (users: User[]): void => saveToStorage(DB_USERS_KEY, users),

    getGroups: (): Group[] => {
        const groups = getFromStorage<Group[]>(DB_GROUPS_KEY, []);
        if (groups.length === 0) {
            return seedInitialGroups();
        }
        return groups;
    },
    saveGroups: (groups: Group[]): void => saveToStorage(DB_GROUPS_KEY, groups),
    
    getChats: (): Chat => getFromStorage<Chat>(DB_CHATS_KEY, {}),
    saveChats: (chats: Chat): void => saveToStorage(DB_CHATS_KEY, chats),

    getStatuses: (): Status[] => {
        const statuses = getFromStorage<Status[]>(DB_STATUS_KEY, []);
        if (statuses.length === 0) {
            return seedInitialStatuses();
        }
        // Filter out statuses older than 24 hours
        return statuses.filter(s => (Date.now() - s.timestamp) < 24 * 60 * 60 * 1000);
    },
    saveStatuses: (statuses: Status[]): void => saveToStorage(DB_STATUS_KEY, statuses),
    
    getAuthenticatedUserId: (): string | null => getFromStorage<string | null>(AUTH_USER_ID_KEY, null),
    setAuthenticatedUserId: (userId: string | null): void => saveToStorage(AUTH_USER_ID_KEY, userId),
    
    getSearchHistory: (): SearchHistory => getFromStorage<SearchHistory>(DB_SEARCH_HISTORY_KEY, {}),
    saveSearchHistory: (history: SearchHistory): void => saveToStorage(DB_SEARCH_HISTORY_KEY, history),

    findUserByName: (name: string): User | undefined => {
        const users = db.getUsers();
        return users.find(u => u.name.toLowerCase() === name.toLowerCase());
    },

    authenticateUser: (name: string, password: string): User | null => {
        const user = db.findUserByName(name);
        if (user && user.password === password) {
            return user;
        }
        return null;
    },
    
    createUser: (name: string, password: string, profilePicUrl?: string): User => {
        const users = db.getUsers();
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            password, // WARNING: Storing plain text passwords is not secure.
            profilePicUrl: profilePicUrl || `https://picsum.photos/seed/${name.toLowerCase()}/200`,
            lastSeen: 'online',
            statusMessage: 'Hi! I am new to Live Chat.',
            friendIds: [],
            friendRequestIds: [],
            blockedUserIds: [],
            pinnedChatIds: [],
        };
        const updatedUsers = [...users, newUser];
        db.saveUsers(updatedUsers);
        return newUser;
    },
};