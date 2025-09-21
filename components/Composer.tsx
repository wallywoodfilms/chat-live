import React, { useState, useContext, useRef, useEffect } from 'react';
import { ChatContext } from '../context/ChatContext';
import { User, Message } from '../types';
import { SendIcon } from './icons/SendIcon';
import { AttachmentIcon } from './icons/AttachmentIcon';
import { XIcon } from './icons/XIcon';
import { FileIcon } from './icons/FileIcon';
import { EmojiIcon } from './icons/EmojiIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import EmojiPicker from './EmojiPicker';

const Composer: React.FC = () => {
    const [text, setText] = useState('');
    const [filePreview, setFilePreview] = useState<{ name: string; url: string; type: 'image' | 'file' } | null>(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const context = useContext(ChatContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { activeChat, notifyTypingStart, notifyTypingStop, sendMessage, replyingTo, setReplyingTo, users } = context || {};

    useEffect(() => {
        if (!activeChat) return;

        const chatId = activeChat.id;
        const recipientId = activeChat && 'members' in activeChat ? null : (activeChat as User).id;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (text.trim()) {
            if (!isTypingRef.current) {
                notifyTypingStart?.(chatId, recipientId);
                isTypingRef.current = true;
            }
            typingTimeoutRef.current = setTimeout(() => {
                notifyTypingStop?.(chatId, recipientId);
                isTypingRef.current = false;
            }, 1500);
        } else {
            if (isTypingRef.current) {
                notifyTypingStop?.(chatId, recipientId);
                isTypingRef.current = false;
            }
        }
        
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };

    }, [text, activeChat, notifyTypingStart, notifyTypingStop]);

    const handleSend = () => {
        if (text.trim() || filePreview) {
            const messageText = text.trim() ? text.trim() : (filePreview?.type === 'file' ? filePreview.name : '');
            sendMessage?.(messageText, filePreview ?? undefined);
            setText('');
            setFilePreview(null);
            setReplyingTo?.(null);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (isTypingRef.current && activeChat) {
                const recipientId = 'members' in activeChat ? null : (activeChat as User).id;
                notifyTypingStop?.(activeChat.id, recipientId);
                isTypingRef.current = false;
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const fileData = {
                        name: file.name,
                        url: event.target.result as string,
                        type: file.type.startsWith('image/') ? 'image' : 'file' as 'image' | 'file'
                    };
                    setFilePreview(fileData);
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Allow selecting the same file again
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            recordingChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = event => {
                recordingChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        sendMessage?.('', { name: `voice-note.webm`, url: event.target.result as string, type: 'voice' });
                    }
                };
                reader.readAsDataURL(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop microphone access
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check your browser permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if(recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };
    
    const formatRecordingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="bg-wa-dark-light flex-shrink-0">
            {replyingTo && (
                 <div className="p-3 border-b border-wa-dark-lighter relative bg-black/20 text-sm">
                     <button onClick={() => setReplyingTo?.(null)} className="absolute top-2 right-2 p-1">
                         <XIcon className="w-4 h-4" />
                     </button>
                     <p className="font-semibold text-indigo-400">Replying to {replyingTo.senderId === context?.currentUser?.id ? 'Yourself' : users?.find(u => u.id === replyingTo.senderId)?.name}</p>
                     <p className="text-wa-text-secondary truncate">{replyingTo.text}</p>
                 </div>
            )}
            {filePreview && (
                 <div className="p-3 border-b border-wa-dark-lighter relative bg-black/20">
                    <button onClick={() => setFilePreview(null)} className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white hover:bg-black/70 z-10">
                        <XIcon className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-3">
                        {filePreview.type === 'image' ? (
                            <img src={filePreview.url} alt={filePreview.name} className="max-h-24 max-w-[50%] rounded-md object-contain" />
                        ) : (
                            <div className="flex items-center space-x-2 bg-wa-dark-lighter p-2 rounded-md">
                                <FileIcon className="w-8 h-8 text-wa-text-secondary flex-shrink-0" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-sm text-wa-text truncate">{filePreview.name}</p>
                            <p className="text-xs text-wa-text-secondary">{filePreview.type === 'image' ? 'Image' : 'File'}</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="p-3 flex items-end space-x-3">
                <div className="relative">
                     <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="p-2 text-wa-text-secondary hover:text-wa-text transition">
                        <EmojiIcon className="w-6 h-6" />
                    </button>
                    {isEmojiPickerOpen && <EmojiPicker 
                        onClose={() => setIsEmojiPickerOpen(false)}
                        onEmojiSelect={(emoji) => setText(prev => prev + emoji)}
                        onStickerSelect={(stickerUrl) => {
                             sendMessage?.('', { name: 'sticker.png', url: stickerUrl, type: 'sticker' });
                             setIsEmojiPickerOpen(false);
                        }}
                    />}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-wa-text-secondary hover:text-wa-text transition">
                    <AttachmentIcon className="w-6 h-6" />
                </button>
                {isRecording ? (
                    <div className="flex-1 bg-wa-dark-lighter rounded-lg px-4 py-2 text-wa-text flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>{formatRecordingTime(recordingTime)}</span>
                    </div>
                ) : (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        rows={1}
                        className="flex-1 bg-wa-dark-lighter rounded-lg px-4 py-2 text-wa-text resize-none focus:outline-none focus:ring-2 focus:ring-wa-green transition max-h-24"
                    />
                )}
                {text || filePreview ? (
                    <button onClick={handleSend} className="bg-wa-green p-2 rounded-full text-white transition hover:bg-wa-green/90 disabled:bg-gray-600">
                        <SendIcon className="w-6 h-6" />
                    </button>
                ) : (
                     <button onMouseDown={startRecording} onMouseUp={stopRecording} onMouseLeave={stopRecording} className={`p-2 rounded-full text-white transition ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-wa-green'}`}>
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Composer;