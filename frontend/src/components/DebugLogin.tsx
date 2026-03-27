import React, { useState } from 'react';
import { apiClient } from '../services/api';

const DebugLogin: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLogin = async () => {
    addDebug('Starting login test...');
    
    try {
      addDebug('Calling apiClient.login...');
      const response = await apiClient.login({
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      
      addDebug(`✅ Login successful! Response: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      addDebug(`❌ Login failed: ${error.message}`);
      addDebug(`Error details: ${JSON.stringify(error, null, 2)}`);
    }
  };

  const testDirectAPI = async () => {
    addDebug('Testing direct API call...');
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5174'
        },
        body: JSON.stringify({
          email: 'admin@example.com',
          password: 'Admin@123'
        })
      });
      
      const data = await response.json();
      addDebug(`Direct API response: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      addDebug(`Direct API failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Login Debug</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Test API Client Login
          </button>
          
          <button
            onClick={testDirectAPI}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 ml-4"
          >
            Test Direct API Call
          </button>
          
          <button
            onClick={() => setDebugInfo([])}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 ml-4"
          >
            Clear Debug
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Debug Output:</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <div className="text-gray-500">No debug output yet. Click a test button above.</div>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugLogin;



