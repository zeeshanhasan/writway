'use client';

export default function TestPage() {
  const testAPI = () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    console.log('API Base URL:', base);
    alert(`API URL: ${base}`);
  };

  return (
    <div className="p-8">
      <h1>API Test Page</h1>
      <button 
        onClick={testAPI}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test API URL
      </button>
    </div>
  );
}
