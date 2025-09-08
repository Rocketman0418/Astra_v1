import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <img 
          src="/RocketHub Logo Alt 1.png" 
          alt="RocketHub Logo" 
          className="h-10 sm:h-14 w-auto flex-shrink-0"
          onError={(e) => {
            console.error('Logo failed to load:', e);
            // Hide the image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex-1 text-center">
          <h1 className="text-sm sm:text-xl font-bold text-white flex items-center justify-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm sm:text-lg">🚀</span>
            </div>
            <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-wide truncate">
              Astra: Company Intelligence Agent
            </span>
          </h1>
        </div>
        <div className="w-10 sm:w-14 flex-shrink-0"></div> {/* Spacer for centering - matches logo width */}
      </div>
    </header>
  );
};

export default Header;