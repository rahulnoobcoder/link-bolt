import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

function App() {
  // State for routing (simple internal routing based on path)
  const [viewId, setViewId] = useState(window.location.pathname.substring(1));
  const [retrievedData, setRetrievedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for Upload
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'file'
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch link if ID exists in URL
  useEffect(() => {
    if (viewId) {
      setLoading(true);
      axios.get(`http://localhost:3000/${viewId}`)
        .then(res => setRetrievedData(res.data))
        .catch(err => setError('Link not found or expired'))
        .finally(() => setLoading(false));
    }
  }, [viewId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('type', activeTab);
    formData.append('expiration', 24); // Hardcoded 24h for simple UI

    if (activeTab === 'text') {
      formData.append('content', text);
    } else {
      formData.append('file', file);
    }

    try {
      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGeneratedLink(res.data.link);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- VIEW MODE ---
  if (viewId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4 text-white">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-400">Decryption in progress...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Link Expired</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <a href="/" className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg transition">Create New Link</a>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                <h1 className="text-xl font-bold text-blue-400">Secure Content</h1>
                <span className="text-xs text-gray-500">
                  Expires {formatDistanceToNow(new Date(retrievedData.expiresAt), { addSuffix: true })}
                </span>
              </div>

              {retrievedData.type === 'text' ? (
                <div className="bg-gray-900 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96 border border-gray-700">
                  {retrievedData.content}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📄</div>
                  <p className="text-lg mb-6">{retrievedData.filename}</p>
                  <a 
                    href={`http://localhost:3000/download/${viewId}`} 
                    className="inline-block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg"
                  >
                    Download File
                  </a>
                </div>
              )}
              <a href="/" className="block text-center text-sm text-gray-500 hover:text-gray-300 mt-4">Create your own secure link</a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- CREATE MODE ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">LinkVault</h1>
        <p className="text-gray-400">Share text and files securely. Ephemeral & One-time.</p>
      </div>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        {!generatedLink ? (
          <>
            {/* Tabs */}
            <div className="flex mb-6 bg-gray-900 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 rounded-md transition-all ${activeTab === 'text' ? 'bg-blue-600 shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                Text
              </button>
              <button 
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-2 rounded-md transition-all ${activeTab === 'file' ? 'bg-blue-600 shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                File
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              {activeTab === 'text' ? (
                <textarea
                  className="w-full h-40 p-4 bg-gray-900 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  placeholder="Paste your sensitive data here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                />
              ) : (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer relative">
                  <input 
                    type="file" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-sm text-gray-400">{file ? file.name : "Drag & Drop or Click to Upload"}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg transition transform active:scale-95 flex justify-center items-center"
              >
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Generate Secure Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center animate-fade-in-up">
            <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
              <span className="text-4xl">🔒</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Link Generated!</h3>
            <p className="text-gray-400 text-sm mb-6">This link allows access to your content. Share it cautiously.</p>
            
            <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-2 mb-6">
              <input 
                type="text" 
                readOnly 
                value={generatedLink} 
                className="bg-transparent flex-1 text-gray-300 text-sm outline-none px-2"
              />
              <button 
                onClick={copyToClipboard}
                className={`px-4 py-1.5 rounded text-sm font-medium transition ${copySuccess ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <button 
              onClick={() => { setGeneratedLink(''); setText(''); setFile(null); }}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Upload another item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;