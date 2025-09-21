import React, { useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from '../context/ChatContext';
import { User } from '../types';
import { useUserMedia } from '../hooks/useUserMedia';
import { PhoneIcon } from './icons/PhoneIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { MicrophoneOffIcon } from './icons/MicrophoneOffIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { VideoCameraOffIcon } from './icons/VideoCameraOffIcon';
import { SignalIcon } from './icons/SignalIcon';

// Helper to format time
const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
};

type VideoQuality = 'good' | 'fair' | 'poor';

const CallModal: React.FC = () => {
    const context = useContext(ChatContext);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [callStatus, setCallStatus] = useState('Ringing...');
    const [videoQuality, setVideoQuality] = useState<VideoQuality>('good');

    if (!context || !context.isCallActive || !context.activeChat || 'members' in context.activeChat) {
        return null;
    }
    const { currentUser, isCallActive, activeChat, endCall } = context;
    const friend = activeChat as User;
    
    const [isVideoEnabled, setIsVideoEnabled] = useState(isCallActive === 'video');

    const { stream } = useUserMedia({ video: isCallActive === 'video', audio: true });

    useEffect(() => {
        if (stream && localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Simulate call connection and timer
    useEffect(() => {
        const connectTimeout = setTimeout(() => {
            setCallStatus('Connected');
        }, 3000); // Connect after 3 seconds

        let interval: ReturnType<typeof setInterval>;
        if (callStatus === 'Connected') {
            interval = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        }

        return () => {
            clearTimeout(connectTimeout);
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [callStatus]);

    // Simulate video quality changes
    useEffect(() => {
        if (callStatus !== 'Connected') return;

        const qualityLevels: VideoQuality[] = ['good', 'good', 'fair', 'good', 'poor', 'good'];
        let qualityIndex = 0;

        const qualityInterval = setInterval(() => {
            qualityIndex = (qualityIndex + 1) % qualityLevels.length;
            setVideoQuality(qualityLevels[qualityIndex]);
        }, 5000); // Change every 5 seconds

        return () => {
            clearInterval(qualityInterval);
        };
    }, [callStatus]);


    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (stream && isCallActive === 'video') {
            stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(prev => !prev);
        }
    };

    const handleEndCall = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        endCall();
    };

    const qualityStyles = {
        good: { color: 'text-green-500', label: 'Good' },
        fair: { color: 'text-yellow-500', label: 'Fair' },
        poor: { color: 'text-red-500', label: 'Poor' },
    };
    const currentQualityStyle = qualityStyles[videoQuality];


    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 backdrop-blur-lg z-50 flex flex-col p-4 text-white">
            {/* Remote participant view */}
            <div className="relative flex-1 flex flex-col items-center justify-center bg-black/30 rounded-lg">
                <img 
                    src={friend.profilePicUrl} 
                    alt={friend.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-600 shadow-lg"
                />
                <h2 className="text-3xl font-bold mt-6">{friend.name}</h2>
                <p className="text-gray-400 mt-2">
                    {callStatus === 'Connected' ? formatDuration(duration) : callStatus}
                </p>
            </div>

            {/* Local video feed */}
            {isCallActive === 'video' && (
                <div className="absolute top-6 right-6 w-32 md:w-48 h-auto aspect-[3/4] bg-black rounded-lg shadow-md overflow-hidden border-2 border-gray-700">
                    {isVideoEnabled && stream ? (
                        <video ref={localVideoRef} autoPlay muted className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-wa-dark-light">
                            <img src={currentUser?.profilePicUrl} alt="You" className="w-16 h-16 rounded-full object-cover" />
                        </div>
                    )}
                     {callStatus === 'Connected' && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-auto bg-black/50 px-2 py-0.5 rounded-full flex items-center space-x-1 text-xs backdrop-blur-sm">
                            <SignalIcon className={`w-3 h-3 ${currentQualityStyle.color}`} />
                            <span className={currentQualityStyle.color}>{currentQualityStyle.label}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Controls */}
            <div className="flex-shrink-0 flex items-center justify-center space-x-6 pt-6">
                <button 
                    onClick={toggleMute} 
                    className="bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <MicrophoneOffIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
                </button>
                
                {isCallActive === 'video' && (
                    <button 
                        onClick={toggleVideo} 
                        className="bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition"
                        aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoEnabled ? <VideoCameraIcon className="w-6 h-6" /> : <VideoCameraOffIcon className="w-6 h-6" />}
                    </button>
                )}

                <button 
                    onClick={handleEndCall} 
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full p-4 transition-transform transform hover:scale-110"
                    aria-label="End call"
                >
                    <PhoneIcon className="w-8 h-8 transform rotate-[135deg]" />
                </button>
            </div>
        </div>
    );
};

export default CallModal;