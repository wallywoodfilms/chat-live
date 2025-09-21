export interface User {
  id: string;
  name: string;
  password: string; // WARNING: Storing plain text passwords is not secure. For demonstration only.
  profilePicUrl: string;
  lastSeen: 'online' | number;
  statusMessage?: string;
  friendIds: string[];
  friendRequestIds: string[];
  blockedUserIds: string[];
  pinnedChatIds?: string[];
}

export interface Group {
  id: string;
  name: string;
  profilePicUrl: string;
  description?: string;
  members: string[]; // array of user ids
  admins: string[]; // array of user ids
  createdBy: string;
}

export interface Message {
  id:string;
  senderId: string;
  text: string;
  timestamp: number;
  type: 'text' | 'image' | 'file' | 'system' | 'status_reply' | 'voice' | 'sticker' | 'call_info';
  file?: {
    name: string;
    url: string; // Base64 URL
  };
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  replyToStatus?: {
    statusUrl: string;
    statusType: 'image' | 'video';
    statusOwnerName: string;
  };
  readBy: string[];
  callInfo?: {
    type: 'voice' | 'video';
    ended: boolean;
  }
}

export interface Status {
  id: string;
  userId: string;
  type: 'image' | 'video';
  url: string;
  timestamp: number;
  viewedBy: string[];
}

export interface Chat {
  [chatId: string]: Message[];
}

export type NotificationType = 'friend_request' | 'new_message';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  fromUserId?: string;
  timestamp: number;
}