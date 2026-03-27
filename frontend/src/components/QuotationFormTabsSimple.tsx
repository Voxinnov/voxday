import React, { useState } from 'react';
import { Quotation } from '../types';

interface QuotationFormTabsSimpleProps {
  quotation?: Quotation;
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
}

const QuotationFormTabsSimple: React.FC<QuotationFormTabsSimpleProps> = ({
  quotation,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'modules' | 'summary'>('details');

  const tabs = [
    { id: 'details', name: 'Details', icon: '📋' },
    { id: 'modules', name: 'Modules', icon: '⚙️' },
    { id: 'summary', name: 'Summary & Preview', icon: '📊' }
  ] as const;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
              <p className="text-gray-600">Enter project and client information here.</p>
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Development Modules</h3>
              <p className="text-gray-600">Add development modules and effort estimates here.</p>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown & Preview</h3>
              <p className="text-gray-600">Review costs and generate quotation here.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'details' ? 'modules' : activeTab === 'modules' ? 'summary' : 'details')}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {activeTab === 'details' ? 'Next: Modules' : activeTab === 'modules' ? 'Next: Summary' : 'Back to Details'}
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Mock save for testing
                  console.log('Save clicked');
                  onCancel();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {quotation ? 'Update Quotation' : 'Create Quotation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationFormTabsSimple;
