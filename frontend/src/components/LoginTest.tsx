import React, { useState } from 'react';
import { apiClient } from '../services/api';

const LoginTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');
    
    try {
      const response = await apiClient.login({
        email: 'admin@example.com',
        password: 'Admin@123'
      });
      
      setResult(`✅ Login successful! User: ${response.data.user.name}`);
    } catch (error: any) {
      setResult(`❌ Login failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Login Test</h1>
        
        <button
          onClick={testLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Test Credentials:</strong></p>
          <p>Email: admin@example.com</p>
          <p>Password: Admin@123</p>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;



