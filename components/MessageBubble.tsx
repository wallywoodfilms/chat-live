import React, { useContext, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { ChatContext } from '../context/ChatContext';
import { DoubleCheckIcon } from './icons/DoubleCheckIcon';
import { ReplyIcon } from './icons/ReplyIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';

interface MessageBubbleProps {
    message: Message;
    highlight?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, highlight }) => {
    const context = useContext(ChatContext);
    if (!context || !context.currentUser) return null;

    const { currentUser, activeChat, users, setReplyingTo } = context;
    const isMe = message.senderId === currentUser.id;
    const isSystem = message.type === 'system';
    const isGroup = activeChat && 'members' in activeChat;

    const sender = isGroup ? users.find(u => u.id === message.senderId) : null;
    
    const messageRef = useRef<HTMLDivElement>(null);

    const scrollToMessage = (messageId: string) => {
        const element = document.getElementById(`msg-${messageId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element?.classList.add('animate-pulse-once');
        setTimeout(() => element?.classList.remove('animate-pulse-once'), 1000);
    };

    if (isSystem) {
        return (
             <div className="flex justify-center my-2">
                <div className="text-xs text-wa-text-secondary bg-wa-dark-lighter/80 rounded-full px-3 py-1">
                    {message.text}
                </div>
            </div>
        )
    }

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const ReadReceipt = () => {
        if (!isMe || !activeChat) return null;
        
        const recipients = isGroup 
            ? activeChat.members.filter(id => id !== currentUser.id)
            : [(activeChat as User).id];

        const allRecipientsRead = recipients.every(recipientId => message.readBy.includes(recipientId));

        return (
            <span className="ml-1.5">
                <DoubleCheckIcon colorClass={allRecipientsRead ? 'text-blue-400' : 'text-wa-text-secondary'} />
            </span>
        );
    };

    const renderTextWithHighlight = (text: string) => {
         if (highlight) {
            const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
            return (
                <p className="whitespace-pre-wrap">
                    {parts.map((part, index) => 
                        part.toLowerCase() === highlight.toLowerCase() ? (
                            <mark key={index} className="bg-yellow-400/80 text-black rounded px-0.5">{part}</mark>
                        ) : (
                            part
                        )
                    )}
                </p>
            );
        }
        return <p className="whitespace-pre-wrap">{text}</p>;
    }
    
    const VoiceMessagePlayer: React.FC<{ file: { url: string; name: string }, isMe: boolean }> = ({ file, isMe }) => {
        const audioRef = useRef<HTMLAudioElement>(null);
        const [isPlaying, setIsPlaying] = React.useState(false);
        const [duration, setDuration] = React.useState(0);
        const [currentTime, setCurrentTime] = React.useState(0);

        const togglePlay = () => {
            if (audioRef.current) {
                if (isPlaying) audioRef.current.pause();
                else audioRef.current.play();
            }
        };

        const handleTimeUpdate = () => {
            if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
            }
        };
        
        const handleLoadedMetadata = () => {
            if (audioRef.current) {
                setDuration(audioRef.current.duration);
            }
        };

        const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
            if (audioRef.current) {
                audioRef.current.currentTime = Number(event.target.value);
            }
        };
        
        const formatAudioTime = (time: number) => {
            if (isNaN(time) || time === 0) return '0:00';
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        };

        useEffect(() => {
          const audio = audioRef.current;
          const handlePlay = () => setIsPlaying(true);
          const handlePause = () => setIsPlaying(false);

          audio?.addEventListener('play', handlePlay);
          audio?.addEventListener('pause', handlePause);
          audio?.addEventListener('ended', handlePause);

          return () => {
            audio?.removeEventListener('play', handlePlay);
            audio?.removeEventListener('pause', handlePause);
            audio?.removeEventListener('ended', handlePause);
          }
        }, []);


        return (
            <div className="flex items-center space-x-2 w-64 text-wa-text">
                 <button onClick={togglePlay} className="flex-shrink-0 p-2 rounded-full focus:outline-none transition-transform hover:scale-110">
                    {isPlaying ? <PauseIcon className="w-6 h-6"/> : <PlayIcon className="w-6 h-6"/>}
                 </button>
                 <div className="flex-grow flex items-center space-x-2">
                     <div className="relative w-full flex items-center">
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1.5 appearance-none cursor-pointer rounded-full bg-white/30 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                         <div 
                             className="absolute top-0 left-0 h-1.5 rounded-full bg-white pointer-events-none"
                             style={{ width: `${(currentTime / duration) * 100}%` }}
                         ></div>
                     </div>
                     <span className="text-xs w-20 text-center text-wa-text-secondary">{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</span>
                 </div>
                <audio 
                    ref={audioRef} 
                    src={file.url} 
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    preload="metadata"
                />
            </div>
        );
    };

    const renderContent = () => {
        switch (message.type) {
            case 'status_reply':
                return message.replyToStatus ? (
                    <div>
                        <div className="bg-black/20 p-2 rounded-lg mb-1.5 opacity-90 flex items-center space-x-2">
                            {message.replyToStatus.statusType === 'image' ? (
                                <img src={message.replyToStatus.statusUrl} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                            ) : (
                                <video src={message.replyToStatus.statusUrl} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-indigo-300">Status Reply</p>
                                <p className="text-xs text-wa-text-secondary truncate">Replying to {message.replyToStatus.statusOwnerName}</p>
                            </div>
                        </div>
                        {renderTextWithHighlight(message.text)}
                    </div>
                ) : null;
            case 'image':
                return <img src={message.file?.url} alt={message.file?.name} className="max-w-xs rounded-lg mt-1" />;
             case 'sticker':
                return <img src={message.file?.url} alt={message.file?.name} className="w-32 h-32" />;
            case 'file':
                return message.file ? (
                    <a href={message.file.url} download={message.file.name} className="flex items-center space-x-2 bg-black/20 p-2 rounded-lg mt-1 hover:bg-black/40">
                        <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
                        <span className="truncate text-sm">{message.file.name}</span>
                    </a>
                ) : null;
             case 'voice':
                return message.file ? <VoiceMessagePlayer file={message.file} isMe={isMe} /> : null;
            case 'call_info':
                return message.callInfo ? (
                    <div className="flex items-center space-x-2 text-wa-text-secondary">
                        {message.callInfo.type === 'video' ? <VideoCameraIcon className="w-4 h-4"/> : <PhoneIcon className="w-4 h-4" />}
                        <span>{message.text}</span>
                    </div>
                ) : null;
            default:
                return renderTextWithHighlight(message.text);
        }
    }

    return (
        <div id={`msg-${message.id}`} className={`group flex items-start ${isMe ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex items-center ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                 <button onClick={() => setReplyingTo(message)} className="p-2 text-wa-text-secondary rounded-full hover:bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ReplyIcon className="w-4 h-4" />
                </button>
                {isGroup && !isMe && sender && (
                    <img src={sender.profilePicUrl} alt={sender.name} className="w-6 h-6 rounded-full mr-2 flex-shrink-0 self-end mb-1" />
                )}
                <div ref={messageRef} className={`max-w-md md:max-w-lg rounded-lg px-3 py-2 shadow-md text-wa-text ${isMe ? 'bg-wa-me' : 'bg-wa-friend'}`}>
                    {isGroup && !isMe && sender && (
                        <p className="text-xs font-semibold text-indigo-300 mb-1">{sender.name}</p>
                    )}
                    
                    {message.replyTo && (
                        <button 
                            onClick={() => scrollToMessage(message.replyTo!.messageId)}
                            className="bg-black/20 p-2 rounded-lg mb-1.5 opacity-90 text-left w-full border-l-2 border-indigo-400"
                        >
                            <p className="text-sm font-semibold text-indigo-300">{message.replyTo.senderName}</p>
                            <p className="text-xs text-wa-text-secondary truncate">{message.replyTo.text}</p>
                        </button>
                    )}
                    
                    {renderContent()}

                    <div className="text-right text-xs text-wa-text-secondary/80 mt-1 flex items-center justify-end">
                        <span>{formatTimestamp(message.timestamp)}</span>
                        <ReadReceipt />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;