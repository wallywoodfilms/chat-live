export const formatLastSeen = (status: 'online' | number): string => {
    if (status === 'online') {
        return 'online';
    }

    const now = new Date();
    const lastSeenDate = new Date(status);
    const diffSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
        return 'last seen just now';
    }
    if (diffMinutes < 60) {
        return `last seen ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    
    const isToday = now.toDateString() === lastSeenDate.toDateString();
    if (isToday) {
        return `last seen today at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === lastSeenDate.toDateString();
    if (isYesterday) {
        return `last seen yesterday at ${lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `last seen on ${lastSeenDate.toLocaleDateString()}`;
};
