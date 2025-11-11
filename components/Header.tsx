import React from 'react';

interface HeaderProps {
  onGoToSavedPosts: () => void;
  onGoHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onGoToSavedPosts, onGoHome }) => (
  <header className="bg-secondary/50 backdrop-blur-sm sticky top-0 z-10 w-full border-b border-white/10">
    <div className="container mx-auto px-4 py-4 flex justify-between items-center">
      <div>
        <button onClick={onGoHome} className="text-left focus:outline-none">
          <h1 className="text-3xl font-black tracking-tighter text-text-primary">
            Global Gist <span className="text-accent">Blog</span>
          </h1>
          <p className="text-text-secondary text-sm mt-1">Your #1 source for global insights.</p>
        </button>
      </div>
      <button
        onClick={onGoToSavedPosts}
        className="bg-accent/80 hover:bg-accent text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
      >
        Saved
      </button>
    </div>
  </header>
);

export default Header;