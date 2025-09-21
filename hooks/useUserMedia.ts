import { useState, useEffect } from 'react';

export const useUserMedia = (constraints: MediaStreamConstraints) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let didCancel = false;
        let mediaStream: MediaStream | null = null;

        const getUserMedia = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia(constraints);
                if (!didCancel) {
                    setStream(s);
                    mediaStream = s;
                }
            } catch (err) {
                if (!didCancel) {
                    setError(err instanceof Error ? err.message : String(err));
                }
            }
        };

        if (constraints.video || constraints.audio) {
            getUserMedia();
        }

        return () => {
            didCancel = true;
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [JSON.stringify(constraints)]);

    return { stream, error };
};