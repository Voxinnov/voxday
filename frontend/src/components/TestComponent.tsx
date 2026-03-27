import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">VOXTREE Test Component</h1>
        <p className="text-gray-600 mb-4">This is a test component to verify the React app is working.</p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">✅ React is working</p>
          <p className="text-sm text-gray-500">✅ TypeScript is working</p>
          <p className="text-sm text-gray-500">✅ Tailwind CSS is working</p>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;



