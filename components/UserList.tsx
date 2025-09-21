
import React, { useState } from 'react';
import { User } from '../types';
import UserListItem from './UserListItem';

interface UserListProps {
    title: string;
    users: User[];
    type: 'friends' | 'requests' | 'people';
}

const UserList: React.FC<UserListProps> = ({ title, users, type }) => {
    const [isExpanded, setIsExpanded] = useState(type !== 'people');

    if (users.length === 0) {
        return null;
    }

    return (
        <div className="p-3">
            <h3
                className="text-sm font-semibold text-wa-green tracking-wide uppercase flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {title} ({users.length})
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </h3>
            {isExpanded && (
                <div className="mt-2 space-y-1">
                    {users.map(user => (
                        <UserListItem key={user.id} user={user} type={type} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserList;
