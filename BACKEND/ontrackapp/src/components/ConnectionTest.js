// src/components/ConnectionTest.js
import React, { useState, useEffect } from 'react';
import { apiClient, getApiInfo } from '../services/api';

const ConnectionTest = () => {
  const [apiInfo, setApiInfo] = useState({});
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get API configuration
    setApiInfo(getApiInfo());
  }, []);

  const testConnection = async () => {
    setLoading(true);
    setTestResult('Testing...');
    
    try {
      // Test a simple endpoint (create this in your backend)
      const response = await apiClient.get('/health');
      
      if (response.status === 200) {
        setTestResult(`✅ Connected successfully! (Status: ${response.status})`);
      } else {
        setTestResult(`⚠️ Connected but got status: ${response.status}`);
      }
    } catch (error) {
      setTestResult(`❌ Connection failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      margin: '20px 0',
      border: '1px solid #ddd',
      borderRadius: '8px',
      background: '#f8f9fa'
    }}>
      <h3>🔗 API Connection Status</h3>
      
      <div style={{ margin: '15px 0' }}>
        <p><strong>Environment:</strong> {apiInfo.isDevelopment ? 'Development' : 'Production'}</p>
        <p><strong>API URL:</strong> {apiInfo.api?.baseURL}</p>
        <p><strong>Backend Domain:</strong> {apiInfo.domains?.backend}</p>
      </div>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {testResult && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: testResult.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          {testResult}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
        <p><strong>Expected Behavior:</strong></p>
        <ul>
          <li><strong>Development:</strong> {apiInfo.domains?.frontend} → {apiInfo.domains?.backend}/api</li>
          <li><strong>Production:</strong> platformontrackconnect.co.za → api.ontrackconnect.co.za/api</li>
        </ul>
      </div>
    </div>
  );
};

export default ConnectionTest;