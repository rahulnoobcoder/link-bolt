import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { FiCopy, FiUploadCloud, FiFileText, FiDownload, FiCheck, FiGithub } from 'react-icons/fi';

// Helper to get ID from URL path
const getIdFromPath = () => window.location.pathname.substring(1);

function App() {
  const [viewId, setViewId] = useState(getIdFromPath());
  const [retrievedData, setRetrievedData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Upload State
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');

  useEffect(() => {
    if (viewId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`http://localhost:3000/${viewId}`);
          setRetrievedData(res.data);
        } catch (err) {
          toast.error(err.response?.status === 410 ? 'Link Expired!' : 'Link Not Found');
          setTimeout(() => { window.location.href = '/'; }, 2000);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [viewId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!text && !file) return toast.error("Please add content to upload!");

    const loadToast = toast.loading('Encrypting & Uploading...');
    const formData = new FormData();
    formData.append('type', activeTab);
    
    if (activeTab === 'text') formData.append('content', text);
    else formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGeneratedLink(res.data.link);
      toast.success('Secure Link Generated!', { id: loadToast });
    } catch (err) {
      toast.error('Upload Failed', { id: loadToast });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link Copied to Clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-purple-500 selection:text-white overflow-hidden relative">
      <Toaster position="top-center" />
      
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-tight cursor-default">
            LinkVault
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Secure, Ephemeral, Simple.</p>
        </motion.div>

        {/* Main Card */}
        <motion.div 
          layout
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-lg bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
        >
          
          {/* --- VIEW CONTENT MODE --- */}
          {viewId && retrievedData ? (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-green-400"><FiCheck /></span> Secure Content
                </h2>
                <button onClick={() => window.location.href='/'} className="text-sm text-gray-400 hover:text-white transition">New Upload</button>
              </div>

              {retrievedData.type === 'text' ? (
                <div className="bg-gray-900/80 p-4 rounded-xl border border-gray-700 font-mono text-sm text-gray-300 break-words whitespace-pre-wrap max-h-96 overflow-auto shadow-inner">
                  {retrievedData.content}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-600">
                  <div className="text-6xl mb-4 mx-auto w-fit text-blue-400"><FiFileText /></div>
                  <p className="text-lg font-medium text-white mb-2">{retrievedData.filename}</p>
                  <p className="text-sm text-gray-500 mb-6">Ready for download</p>
                  <a 
                    href={`http://localhost:3000/download/${viewId}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-lg shadow-blue-600/20"
                  >
                    <FiDownload /> Download Now
                  </a>
                </div>
              )}
            </div>
          ) : viewId && loading ? (
             <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400 animate-pulse">Decrypting vault...</p>
             </div>
          ) : !generatedLink ? (
            /* --- CREATE UPLOAD MODE --- */
            <div className="p-1">
              {/* Custom Tab Switcher */}
              <div className="flex bg-gray-900/50 p-1 m-4 rounded-xl">
                {['text', 'file'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setFile(null); setText(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                      activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeTab" 
                        className="absolute inset-0 bg-gray-700 shadow-sm rounded-lg"
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {tab === 'text' ? <FiFileText /> : <FiUploadCloud />} 
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <form onSubmit={handleUpload} className="px-8 pb-8 pt-2 space-y-6">
                <AnimatePresence mode='wait'>
                  {activeTab === 'text' ? (
                    <motion.div 
                      key="text-input"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <textarea
                        className="w-full h-40 bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
                        placeholder="Paste your secret message, API keys, or sensitive data here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="file-input"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-900/30 hover:bg-gray-800/50 hover:border-purple-500 transition group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FiUploadCloud className="w-10 h-10 text-gray-400 group-hover:text-purple-400 transition mb-3" />
                          <p className="text-sm text-gray-400 group-hover:text-gray-300">
                            {file ? <span className="text-purple-400 font-semibold">{file.name}</span> : "Click to upload or drag and drop"}
                          </p>
                        </div>
                        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                      </label>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/30 transform transition hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Secure Link
                </button>
              </form>
            </div>
          ) : (
            /* --- RESULT MODE --- */
            <div className="p-8 text-center">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <FiCheck className="w-8 h-8" />
              </motion.div>
              
              <h3 className="text-xl font-bold text-white mb-2">Vault Created!</h3>
              <p className="text-gray-400 text-sm mb-6">This link will expire in 24 hours.</p>

              <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg p-2 mb-6">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink} 
                  className="bg-transparent flex-1 text-gray-300 text-sm outline-none px-2"
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition"
                >
                  <FiCopy />
                </button>
              </div>

              <button 
                onClick={() => { setGeneratedLink(''); setText(''); setFile(null); }}
                className="text-gray-400 hover:text-white text-sm underline transition"
              >
                Upload another item
              </button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-gray-500 text-sm flex items-center gap-2">
          <FiGithub /> 
          <a href="#" className="hover:text-gray-300 transition">Open Source Project</a>
        </div>
      </div>
    </div>
  );
}

export default App;