import React, { useState } from 'react';
import { Group } from '../types';
import GroupListItem from './GroupListItem';

interface GroupListProps {
    title: string;
    groups: Group[];
}

const GroupList: React.FC<GroupListProps> = ({ title, groups }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (groups.length === 0) {
        return null;
    }

    return (
        <div className="p-3">
            <h3
                className="text-sm font-semibold text-wa-green tracking-wide uppercase flex justify-between items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {title} ({groups.length})
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </h3>
            {isExpanded && (
                <div className="mt-2 space-y-1">
                    {groups.map(group => (
                        <GroupListItem key={group.id} group={group} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GroupList;
