import React, { useState, useContext, useMemo } from 'react';
import { ChatContext } from '../context/ChatContext';
import { Group, User } from '../types';
import { useImageUpload } from '../hooks/useImageUpload';
import { XIcon } from './icons/XIcon';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import ContextMenu from './ContextMenu';

interface GroupInfoModalProps {
    group: Group;
    onClose: () => void;
}

const AddMembersView: React.FC<{ group: Group, onBack: () => void }> = ({ group, onBack }) => {
    const { currentUser, friends, addMemberToGroup } = useContext(ChatContext)!;
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

    const friendsNotInGroup = useMemo(() => {
        return friends.filter(friend => !group.members.includes(friend.id));
    }, [friends, group.members]);

    const handleAdd = () => {
        selectedFriends.forEach(friendId => addMemberToGroup(group.id, friendId));
        onBack();
    };

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Members</h3>
            <div className="max-h-60 overflow-y-auto bg-wa-dark-lighter rounded-md p-2 space-y-2 mb-4">
                {friendsNotInGroup.length > 0 ? friendsNotInGroup.map(friend => (
                    <div key={friend.id} onClick={() => setSelectedFriends(prev => prev.includes(friend.id) ? prev.filter(id => id !== friend.id) : [...prev, friend.id])} className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-wa-dark-light">
                        <div className="flex items-center space-x-3">
                            <img src={friend.profilePicUrl} alt={friend.name} className="w-10 h-10 rounded-full" />
                            <span>{friend.name}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 ${selectedFriends.includes(friend.id) ? 'bg-indigo-600 border-indigo-500' : 'border-gray-500'} flex items-center justify-center`}>
                            {selectedFriends.includes(friend.id) && <CheckIcon className="w-4 h-4 text-white" />}
                        </div>
                    </div>
                )) : <p className="text-center text-wa-text-secondary text-sm p-4">All your friends are already in this group.</p>}
            </div>
            <div className="flex justify-end space-x-2">
                <button onClick={onBack} className="px-4 py-2 rounded-md bg-wa-dark-lighter hover:bg-gray-700">Cancel</button>
                <button onClick={handleAdd} disabled={selectedFriends.length === 0} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800">Add Members</button>
            </div>
        </div>
    );
};


const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ group, onClose }) => {
    const context = useContext(ChatContext);
    const { currentUser, users, updateGroupInfo, removeMemberFromGroup, promoteToAdmin, demoteAdmin, leaveGroup } = context!;
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupName, setGroupName] = useState(group.name);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [groupDesc, setGroupDesc] = useState(group.description || '');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, member: User } | null>(null);
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    
    const { imageUrl, handleFileChange, triggerFileInput, fileInputRef } = useImageUpload(group.profilePicUrl);
    
    const isCurrentUserAdmin = useMemo(() => group.admins.includes(currentUser!.id), [group, currentUser]);

    const members = useMemo(() => {
        return group.members.map(id => users.find(u => u.id === id)).filter((u): u is User => !!u);
    }, [group.members, users]);

    const handleNameSave = () => {
        if (groupName.trim()) {
            updateGroupInfo(group.id, { name: groupName });
            setIsEditingName(false);
        }
    };

    const handleDescSave = () => {
        updateGroupInfo(group.id, { description: groupDesc });
        setIsEditingDesc(false);
    };
    
    const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e);
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
                    updateGroupInfo(group.id, { profilePicUrl: event.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    }
    
    const handleLeaveGroup = () => {
        if(window.confirm("Are you sure you want to leave this group?")) {
            leaveGroup(group.id);
            onClose();
        }
    }
    
    const getMemberMenuOptions = (member: User) => {
        const canPerformAction = isCurrentUserAdmin && currentUser!.id !== member.id && group.createdBy !== member.id;
        if (!canPerformAction) {
            return [];
        }

        const isMemberAdmin = group.admins.includes(member.id);
        const options = [];

        if (isMemberAdmin) {
            options.push({ label: 'Dismiss as Admin', action: () => demoteAdmin(group.id, member.id) });
        } else {
            options.push({ label: 'Make Admin', action: () => promoteToAdmin(group.id, member.id) });
        }

        options.push({
            label: 'Remove from Group',
            action: () => {
                if (window.confirm(`Are you sure you want to remove ${member.name} from the group?`)) {
                    removeMemberFromGroup(group.id, member.id);
                }
            }
        });

        return options;
    };


    const MemberItem: React.FC<{ member: User }> = ({ member }) => {
        const isMemberAdmin = group.admins.includes(member.id);
        const menuOptions = getMemberMenuOptions(member);

        return (
            <div className="flex items-center justify-between p-2 hover:bg-wa-dark-light/50 rounded-lg">
                <div className="flex items-center space-x-3">
                    <img src={member.profilePicUrl} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <p className="font-semibold">{member.name}</p>
                        {isMemberAdmin && <span className="text-xs text-wa-green">Admin</span>}
                    </div>
                </div>
                {menuOptions.length > 0 && (
                    <button onClick={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.pageX, y: e.pageY, member });
                    }} className="p-2 text-wa-text-secondary hover:text-wa-text">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        );
    }
    

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-wa-dark-light w-full max-w-md rounded-lg shadow-2xl border border-gray-700 relative flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex-shrink-0 flex items-center justify-between">
                     <h2 className="text-2xl font-bold text-wa-text">Group Info</h2>
                    <button onClick={onClose} className="text-wa-text-secondary hover:text-wa-text">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {isAddingMembers ? <AddMembersView group={group} onBack={() => setIsAddingMembers(false)} /> : (
                        <>
                            <div className="p-6 flex flex-col items-center space-y-4 border-b border-gray-700">
                                <div className="relative">
                                    <img src={imageUrl} alt={group.name} className="w-24 h-24 rounded-full object-cover border-2 border-gray-600" />
                                    {isCurrentUserAdmin && (
                                        <>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProfilePicChange} />
                                            <button onClick={triggerFileInput} className="absolute bottom-0 right-0 bg-indigo-600 p-1.5 rounded-full hover:bg-indigo-700 transition">
                                                <EditIcon className="h-4 w-4 text-white" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-2 text-xl font-bold">
                                {isEditingName ? (
                                    <>
                                        <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="bg-wa-dark-lighter border-b-2 border-wa-green focus:outline-none text-center" autoFocus onBlur={handleNameSave} onKeyDown={e => e.key === 'Enter' && handleNameSave()} />
                                        <button onClick={handleNameSave}><CheckIcon className="w-5 h-5 text-wa-green"/></button>
                                    </>
                                ) : (
                                    <>
                                        <span>{group.name}</span>
                                        {isCurrentUserAdmin && <button onClick={() => setIsEditingName(true)}><EditIcon className="w-4 h-4 text-wa-text-secondary"/></button>}
                                    </>
                                )}
                                </div>
                                <p className="text-sm text-wa-text-secondary">Group • {group.members.length} members</p>
                            </div>
                            
                             <div className="p-6 border-b border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-wa-green uppercase">Description</h3>
                                    {isCurrentUserAdmin && !isEditingDesc && <button onClick={() => setIsEditingDesc(true)}><EditIcon className="w-4 h-4 text-wa-text-secondary"/></button>}
                                </div>
                                {isEditingDesc ? (
                                    <div>
                                        <textarea value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} rows={3} className="w-full bg-wa-dark-lighter p-2 rounded-md focus:outline-none focus:ring-1 focus:ring-wa-green" autoFocus />
                                        <div className="text-right mt-2">
                                            <button onClick={handleDescSave} className="px-3 py-1 bg-indigo-600 rounded-md text-sm">Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-wa-text-secondary text-sm">{group.description || "No description."}</p>
                                )}
                            </div>
                            
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-wa-green uppercase">{group.members.length} Members</h3>
                                    {isCurrentUserAdmin && <button onClick={() => setIsAddingMembers(true)} className="text-sm text-indigo-400 hover:underline">Add Members</button>}
                                </div>
                                <div className="space-y-1">
                                    {members.map(member => <MemberItem key={member.id} member={member} />)}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {!isAddingMembers && (
                    <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                         <button onClick={handleLeaveGroup} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md">
                            Leave Group
                        </button>
                    </footer>
                )}
            </div>
            {contextMenu && <ContextMenu 
                x={contextMenu.x} 
                y={contextMenu.y} 
                options={getMemberMenuOptions(contextMenu.member)} 
                onClose={() => setContextMenu(null)} />}
        </div>
    );
};

export default GroupInfoModal;