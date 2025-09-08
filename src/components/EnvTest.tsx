import React from 'react';

const EnvTest: React.FC = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div><strong>Environment Debug:</strong></div>
      <div>Mode: {import.meta.env.MODE}</div>
      <div>Prod: {import.meta.env.PROD ? 'true' : 'false'}</div>
      <div>Dev: {import.meta.env.DEV ? 'true' : 'false'}</div>
      <div>API Key: {apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND'}</div>
      <div>API Key Length: {apiKey?.length || 0}</div>
      <div>All Env Vars: {Object.keys(import.meta.env).join(', ')}</div>
    </div>
  );
};

export default EnvTest;