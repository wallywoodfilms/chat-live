import React, { useState } from 'react';

interface EmojiPickerProps {
    onClose: () => void;
    onEmojiSelect: (emoji: string) => void;
    onStickerSelect: (stickerUrl: string) => void;
}

const emojis = [
  '😀', '😂', '😍', '🤔', '😎', '😭', '😡', '👍', '👎', '❤️', '🔥', '🎉', '🚀', '💯', '🙏', '🤯'
];

const stickers = [
    'https://i.imgur.com/K51i4tH.png', // Example Sticker 1
    'https://i.imgur.com/8m6z4gM.png', // Example Sticker 2
    'https://i.imgur.com/J355qN1.png', // Example Sticker 3
    'https://i.imgur.com/tV8LqQZ.png', // Example Sticker 4
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onClose, onEmojiSelect, onStickerSelect }) => {
    const [activeTab, setActiveTab] = useState('emojis');

    return (
        <>
            <div className="fixed inset-0" onClick={onClose} />
            <div className="absolute bottom-full mb-2 w-72 bg-wa-dark-lighter rounded-lg shadow-lg z-20 border border-gray-700">
                <div className="p-2">
                    <div className="flex border-b border-gray-700 mb-2">
                        <button 
                            className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'emojis' ? 'text-wa-green border-b-2 border-wa-green' : 'text-wa-text-secondary'}`}
                            onClick={() => setActiveTab('emojis')}
                        >
                            Emojis
                        </button>
                         <button 
                            className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'stickers' ? 'text-wa-green border-b-2 border-wa-green' : 'text-wa-text-secondary'}`}
                            onClick={() => setActiveTab('stickers')}
                        >
                            Stickers
                        </button>
                    </div>
                     {activeTab === 'emojis' && (
                        <div className="grid grid-cols-6 gap-2">
                            {emojis.map(emoji => (
                                <button key={emoji} onClick={() => onEmojiSelect(emoji)} className="text-2xl rounded-md hover:bg-wa-dark-light p-1">
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                     {activeTab === 'stickers' && (
                        <div className="grid grid-cols-3 gap-2 p-2 max-h-48 overflow-y-auto">
                            {stickers.map(sticker => (
                                <button key={sticker} onClick={() => onStickerSelect(sticker)} className="rounded-md hover:bg-wa-dark-light p-1">
                                    <img src={sticker} alt="sticker" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EmojiPicker;