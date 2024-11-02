'use client';

import { useState } from 'react';

export default function VerifyTwilioPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const handleVerification = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/verify-twilio', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setStatus('success');
        setResult(`Verification successful! SID: ${data.sid}`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setStatus('error');
      setResult(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Twilio Number Verification</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleVerification}
          disabled={status === 'loading'}
          className={`px-4 py-2 rounded ${
            status === 'loading'
              ? 'bg-gray-400'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {status === 'loading' ? 'Verifying...' : 'Verify Twilio Number'}
        </button>

        {status !== 'idle' && (
          <div
            className={`p-4 rounded ${
              status === 'success'
                ? 'bg-green-100 text-green-700'
                : status === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100'
            }`}
          >
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
