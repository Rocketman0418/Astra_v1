import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 p-2 sticky top-0 z-50">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-sm">🚀</span>
          </div>
          <h1 className="text-white font-bold text-sm">Astra AI</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;