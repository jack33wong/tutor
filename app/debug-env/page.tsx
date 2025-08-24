'use client';

export default function DebugEnvPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Environment Variables Debug</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Server-Side Environment Variables</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NODE_ENV
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-medium text-gray-800">{process.env.NODE_ENV || 'Not set'}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OPENAI_API_KEY
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-medium text-gray-800">
                  {process.env.OPENAI_API_KEY ? 
                    `Set (${process.env.OPENAI_API_KEY.substring(0, 20)}...)` : 
                    'Not set'
                  }
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NEXT_PUBLIC_OPENAI_API_KEY
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-medium text-gray-800">
                  {process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 
                    `Set (${process.env.NEXT_PUBLIC_OPENAI_API_KEY.substring(0, 20)}...)` : 
                    'Not set'
                  }
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GEMINI_API_KEY
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-medium text-gray-800">
                  {process.env.GEMINI_API_KEY ? 
                    `Set (${process.env.GEMINI_API_KEY.substring(0, 20)}...)` : 
                    'Not set'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Client-Side Environment Variables</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Window Object Available
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-medium text-gray-800">
                  {typeof window !== 'undefined' ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Local Storage Available
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-medium text-gray-800">
                  {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
