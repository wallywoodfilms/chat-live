import React, { useState, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { useImageUpload } from '../hooks/useImageUpload';
import { LogoIcon } from './icons/LogoIcon';

const AuthModal: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    
    const context = useContext(ChatContext);
    const { imageUrl, setImageUrl, handleFileChange, triggerFileInput, fileInputRef, clearImage } = useImageUpload();


    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !password.trim()) {
            setError('Please enter your name and password.');
            return;
        }
        const success = context?.login(name.trim(), password);
        if (!success) {
            setError('Invalid credentials. Please try again.');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        const success = context?.register(name.trim(), password, imageUrl || `https://picsum.photos/seed/${name.toLowerCase()}/200`);
        if (!success) {
            setError('Username is already taken.');
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setName('');
        setPassword('');
        setConfirmPassword('');
        clearImage();
    };

    const renderLogin = () => (
        <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" autoFocus />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            <button type="submit" disabled={!name.trim() || !password.trim()} className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition duration-300">Login</button>
        </form>
    );
    
    const renderRegister = () => (
         <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" className="w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" autoFocus />
            
            <div className="flex items-center space-x-2">
                <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Profile Picture URL or Upload" className="flex-1 bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <button type="button" onClick={triggerFileInput} className="px-4 py-3 bg-wa-dark-lighter border border-gray-600 rounded-md hover:bg-gray-700 transition" aria-label="Upload image">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-wa-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </button>
            </div>
            
            {imageUrl && (
                <div className="flex justify-center">
                    <img src={imageUrl} alt="Profile Preview" className="w-20 h-20 rounded-full object-cover border-2 border-gray-600" />
                </div>
            )}

            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full bg-wa-dark-lighter border border-gray-600 rounded-md px-4 py-3 text-wa-text placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition" />
            <button type="submit" disabled={!name.trim() || !password.trim() || !confirmPassword.trim()} className="w-full mt-2 bg-indigo-600 text-white font-semibold py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed transition duration-300">Register</button>
        </form>
    );

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-wa-dark-light w-full max-w-sm rounded-lg shadow-2xl p-8 border border-gray-700">
                <div className="flex flex-col items-center mb-6">
                    <LogoIcon className="w-16 h-16 text-indigo-400" />
                    <h2 className="text-2xl font-bold text-wa-text mt-4">Welcome to Live Chat</h2>
                    <p className="text-wa-text-secondary mt-1">{isLoginView ? 'Login to your account.' : 'Create a new account.'}</p>
                </div>
                
                {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
                
                {isLoginView ? renderLogin() : renderRegister()}

                <p className="text-center text-sm text-wa-text-secondary mt-6">
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button onClick={toggleView} className="font-semibold text-indigo-400 hover:underline">
                        {isLoginView ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthModal;
