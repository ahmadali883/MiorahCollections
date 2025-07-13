import React, { useState } from 'react';

const CheckboxTest = () => {
  const [isChecked, setIsChecked] = useState(false);
  const [testData, setTestData] = useState({
    checkbox1: false,
    checkbox2: false,
    checkbox3: false
  });

  const handleChange = (e) => {
    const { name, checked } = e.target;
    console.log('Checkbox changed:', name, 'checked:', checked);
    setTestData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">Checkbox Functionality Test</h1>
        
        {/* Test 1: Simple checkbox */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Test 1: Simple Checkbox</h2>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mr-2 w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span>Simple checkbox (State: {isChecked ? 'Checked' : 'Unchecked'})</span>
          </label>
        </div>

        {/* Test 2: Styled checkbox like in Contact form */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Test 2: Styled Checkbox (Contact Form Style)</h2>
          <div className="flex items-start">
            <input 
              type="checkbox" 
              id="checkbox2"
              name="checkbox2"
              checked={testData.checkbox2}
              onChange={handleChange}
              className="mr-3 mt-1 w-5 h-5 text-orange-600 bg-white border-2 border-gray-300 rounded focus:ring-orange focus:ring-2 cursor-pointer"
              style={{
                accentColor: '#ff7d1a',
                transform: 'scale(1.1)'
              }}
            />
            <label htmlFor="checkbox2" className="text-sm text-gray-700 cursor-pointer leading-relaxed select-none">
              Marketing consent checkbox (State: {testData.checkbox2 ? 'Checked' : 'Unchecked'})
            </label>
          </div>
        </div>

        {/* Test 3: Custom styled checkbox */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Test 3: Custom Styled Checkbox</h2>
          <div className="flex items-center">
            <div className="relative">
              <input 
                type="checkbox" 
                id="checkbox3"
                name="checkbox3"
                checked={testData.checkbox3}
                onChange={handleChange}
                className="sr-only"
              />
              <div 
                className={`w-6 h-6 border-2 rounded cursor-pointer flex items-center justify-center transition-colors ${
                  testData.checkbox3 
                    ? 'bg-orange border-orange' 
                    : 'bg-white border-gray-300 hover:border-orange'
                }`}
                onClick={() => handleChange({ target: { name: 'checkbox3', checked: !testData.checkbox3 } })}
              >
                {testData.checkbox3 && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <label htmlFor="checkbox3" className="ml-3 text-sm text-gray-700 cursor-pointer">
              Custom styled checkbox (State: {testData.checkbox3 ? 'Checked' : 'Unchecked'})
            </label>
          </div>
        </div>

        {/* Debug info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <pre className="text-sm text-gray-600">
            {JSON.stringify({ isChecked, testData }, null, 2)}
          </pre>
        </div>

        {/* Test buttons */}
        <div className="mt-6 flex gap-4">
          <button 
            onClick={() => setIsChecked(!isChecked)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Simple Checkbox
          </button>
          <button 
            onClick={() => setTestData(prev => ({ ...prev, checkbox2: !prev.checkbox2 }))}
            className="px-4 py-2 bg-orange text-white rounded hover:bg-orange-600"
          >
            Toggle Styled Checkbox
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckboxTest; 