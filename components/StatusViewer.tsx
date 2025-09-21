import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { User } from '../types';
import { ChatContext } from '../context/ChatContext';
import { XIcon } from './icons/XIcon';
import { formatLastSeen } from '../utils/time';
import { SendIcon } from './icons/SendIcon';
import { SpeakerOnIcon } from './icons/SpeakerOnIcon';
import { SpeakerOffIcon } from './icons/SpeakerOffIcon';

interface StatusViewerProps {
    user: User;
    onClose: () => void;
}

const STATUS_DURATION_MS = 5000; // 5 seconds for images

const StatusViewer: React.FC<StatusViewerProps> = ({ user, onClose }) => {
    const context = useContext(ChatContext);
    const { statuses, markStatusAsViewed, sendStatusReply } = context!;

    const userStatuses = useMemo(() => statuses.filter(s => s.userId === user.id).sort((a, b) => a.timestamp - b.timestamp), [statuses, user.id]);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(0.75);
    const [replyText, setReplyText] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const currentStatus = userStatuses[currentIndex];

    useEffect(() => {
        if (currentStatus) {
            markStatusAsViewed(currentStatus.id);
        }
    }, [currentStatus, markStatusAsViewed]);
    
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.volume = volume;
        }
    }, [isMuted, volume, currentIndex]);


    useEffect(() => {
        const advance = () => {
            if (currentIndex < userStatuses.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                onClose();
            }
        };

        if (timerRef.current) clearTimeout(timerRef.current);
        if (!currentStatus || isPaused) return;

        if (currentStatus.type === 'image') {
            timerRef.current = setTimeout(advance, STATUS_DURATION_MS);
        } else if (videoRef.current) {
            videoRef.current.onended = advance;
            videoRef.current.play().catch(e => console.error("Video play failed", e));
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };

    }, [currentIndex, userStatuses, onClose, isPaused, currentStatus]);

    const handleNext = () => {
        if (currentIndex < userStatuses.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Don't pause if clicking on specific interactive elements
        if ((e.target as HTMLElement).closest('.status-reply-composer') || (e.target as HTMLElement).closest('.status-volume-control')) return;
        setIsPaused(true);
        if (videoRef.current) videoRef.current.pause();
    };

    const handleMouseUp = () => {
        setIsPaused(false);
        if (videoRef.current) videoRef.current.play().catch(e => console.error("Video play failed", e));
    };
    
    const handleReply = () => {
        if (replyText.trim() && currentStatus) {
            sendStatusReply(currentStatus, replyText.trim());
            setReplyText('');
            onClose();
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) {
            setIsMuted(false);
        }
        if (newVolume === 0 && !isMuted) {
            setIsMuted(true);
        }
    };

    const toggleMute = () => {
        if (isMuted && volume === 0) {
            setVolume(0.75);
        }
        setIsMuted(!isMuted);
    };

    if (!currentStatus) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-x-2">
                    {userStatuses.map((_, index) => (
                        <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div className={`h-full bg-white transition-all duration-100 ease-linear ${index < currentIndex ? 'w-full' : index === currentIndex ? 'w-0 animate-progress' : 'w-0'}`} style={{ animationPlayState: isPaused ? 'paused' : 'running', animationDuration: currentStatus.type === 'image' ? `${STATUS_DURATION_MS}ms` : undefined }} />
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                     <div className="flex items-center space-x-3">
                        <img src={user.profilePicUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div>
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-gray-300">{formatLastSeen(currentStatus.timestamp)}</p>
                        </div>
                    </div>
                     <div className="flex items-center space-x-2">
                        {currentStatus.type === 'video' && (
                            <div className="relative flex items-center group status-volume-control">
                                <div className="absolute bottom-full mb-2 -right-2 p-2 
                                            bg-black/50 rounded-lg backdrop-blur-sm h-28
                                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto flex items-center justify-center">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        className="h-24 w-2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/25 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                        // Fix: Use 'as any' to allow the non-standard 'bt-lr' value for writingMode, which is used by Firefox for vertical range inputs.
                                        style={{ writingMode: 'bt-lr' as any }}
                                    />
                                </div>
                                <button onClick={toggleMute} className="text-white p-2 z-10">
                                    {(isMuted || volume === 0) ? <SpeakerOffIcon className="w-6 h-6" /> : <SpeakerOnIcon className="w-6 h-6" />}
                                </button>
                            </div>
                        )}
                        <button onClick={onClose} className="text-white p-2">
                            <XIcon className="w-6 h-6" />
                        </button>
                     </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative max-w-md w-full h-auto aspect-[9/16] rounded-lg overflow-hidden" onMouseDown={handleMouseDown}>
                {currentStatus.type === 'image' && (
                    <img src={currentStatus.url} className="w-full h-full object-cover" />
                )}
                 {currentStatus.type === 'video' && (
                    <video ref={videoRef} src={currentStatus.url} className="w-full h-full object-cover" muted={isMuted} playsInline />
                )}
            </div>

            {/* Navigation */}
            <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev}></div>
                <div className="w-2/3 h-full cursor-pointer" onClick={handleNext}></div>
            </div>

            {/* Reply Composer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 status-reply-composer">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                        placeholder={`Reply to ${user.name}...`}
                        className="flex-1 bg-black/50 border border-white/30 rounded-full px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white"
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                    />
                    <button onClick={handleReply} className="bg-wa-green p-2 rounded-full text-white transition hover:bg-wa-green/90 disabled:opacity-50" disabled={!replyText.trim()}>
                        <SendIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress {
                    animation-name: progress;
                    animation-timing-function: linear;
                }
            `}</style>
        </div>
    );
};

export default StatusViewer;