import { useState, useRef } from 'react';

export const useImageUpload = (initialUrl: string = '') => {
    const [imageUrl, setImageUrl] = useState(initialUrl);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImageUrl(event.target.result as string);
                    setImageFile(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const clearImage = () => {
        setImageUrl('');
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }

    return {
        imageUrl,
        setImageUrl,
        imageFile,
        handleFileChange,
        triggerFileInput,
        fileInputRef,
        clearImage,
    };
};
