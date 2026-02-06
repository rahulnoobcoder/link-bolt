import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { FiCopy, FiUpload, FiFileText, FiDownload, FiCheck, FiX, FiRefreshCw, FiAlertTriangle, FiClock, FiLock, FiUnlock } from 'react-icons/fi';

const getIdFromPath = () => window.location.pathname.substring(1);

// --- ⏱️ COUNTDOWN COMPONENT ---
const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
        window.location.reload();
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const seconds = Math.floor((diff / 1000) % 60);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        let timeString = `${hours}h ${minutes}m ${seconds}s`;
        if (days > 0) timeString = `${days}d ` + timeString;
        
        setTimeLeft(timeString);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="font-mono text-[#FF4785]">{timeLeft}</span>;
};

function App() {
  const [viewId] = useState(getIdFromPath());
  const [retrievedData, setRetrievedData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- PASSWORD STATES ---
  const [isProtected, setIsProtected] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputPassword, setInputPassword] = useState(''); // For unlocking
  const [uploadPassword, setUploadPassword] = useState(''); // For creating
  
  // Inputs
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [expiration, setExpiration] = useState(1); // Default 60 mins
  
  const [shake, setShake] = useState(0); 

  // --- INITIAL CHECK ---
  useEffect(() => {
    if (viewId) {
      setLoading(true);
      // First, check if the link exists and if it has a password
      axios.get(`http://localhost:3000/check/${viewId}`)
        .then(res => {
          if (res.data.isProtected) {
            setIsProtected(true);
            // We store the metadata (expiresAt, type) even if locked
            setRetrievedData(res.data);
            setLoading(false);
          } else {
             // Not protected? Fetch full content immediately
             fetchContent(); 
          }
        })
        .catch(() => {
            toast.error('Link not found or expired');
            setLoading(false);
        });
    }
  }, [viewId]);

  // --- FETCH CONTENT (UNLOCK) ---
  const fetchContent = (pwd = null) => {
    // If we are manually unlocking, set loading
    if (pwd) setLoading(true);

    axios.post(`http://localhost:3000/retrieve/${viewId}`, { password: pwd })
      .then(res => {
          setRetrievedData(res.data);
          setIsUnlocked(true);
          toast.success("🔓 VAULT UNLOCKED");
      })
      .catch(() => {
          toast.error('❌ INCORRECT PASSWORD');
          setShake(Math.random() * 20 - 10);
          setTimeout(() => setShake(0), 200);
      })
      .finally(() => setLoading(false));
  };

  const handleUnlock = (e) => {
      e.preventDefault();
      fetchContent(inputPassword);
  };

  // 🔥 SHAKE HANDLER
  const handleTextChange = (e) => {
    setText(e.target.value);
    setShake(Math.random() * 20 - 10);
    setTimeout(() => setShake(0), 50);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!text && !file) return toast.error("⚠️ EMPTY VAULT DETECTED");
    
    setLoading(true);
    const formData = new FormData();
    formData.append('type', activeTab);
    formData.append('expiration', expiration);
    
    if (uploadPassword) formData.append('password', uploadPassword);
    
    if (activeTab === 'text') formData.append('content', text);
    else formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:3000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setGeneratedLink(res.data.link);
      toast.success('🔒 VAULT SEALED');
    } catch {
      toast.error('❌ UPLOAD FAILED');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('📋 COPIED');
  };

  return (
    <div className="min-h-screen bg-[#FFFDF5] font-mono text-black p-4 flex flex-col items-center justify-center overflow-hidden relative selection:bg-[#A3E635]">
      
      <Toaster 
        toastOptions={{
          style: {
            border: '3px solid black',
            boxShadow: '4px 4px 0px 0px black',
            borderRadius: '0px',
            background: 'white',
            color: 'black',
            fontWeight: 'bold',
            fontFamily: 'monospace',
          },
        }}
      />

      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10 text-center relative z-10">
        <h1 className="text-7xl font-black italic tracking-tighter" style={{ textShadow: '4px 4px 0px #000' }}>LINK_BOLT</h1>
      </motion.div>

      <motion.div 
        animate={{ x: shake, rotate: shake / 2 }} 
        className="w-full max-w-xl bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 relative z-10"
      >
        
        {/* --- 🔒 PASSWORD LOCK SCREEN --- */}
        {viewId && isProtected && !isUnlocked ? (
           <div className="text-center">
             <div className="inline-block p-4 border-4 border-black rounded-full mb-6 bg-red-500 text-white shadow-[4px_4px_0px_0px_black]">
                <FiLock className="text-4xl" />
             </div>
             <h2 className="text-3xl font-black uppercase mb-2">RESTRICTED ACCESS</h2>
             <p className="font-bold mb-6 text-gray-500">THIS LINK IS PASSWORD PROTECTED</p>

             <form onSubmit={handleUnlock}>
                <input 
                  type="password" 
                  placeholder="ENTER PASSWORD" 
                  autoFocus
                  className="w-full border-4 border-black p-4 text-center font-black text-xl mb-4 focus:outline-none focus:bg-gray-100 placeholder-gray-300"
                  value={inputPassword}
                  onChange={e => setInputPassword(e.target.value)}
                />
                <button type="submit" disabled={loading} className="w-full bg-black text-white border-4 border-black py-4 text-xl font-black uppercase shadow-[8px_8px_0px_0px_#FF4785] hover:shadow-[4px_4px_0px_0px_#FF4785] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[6px] active:translate-y-[6px] transition-all disabled:opacity-50">
                   {loading ? <FiRefreshCw className="animate-spin inline" /> : 'UNLOCK VAULT'}
                </button>
             </form>
           </div>

        /* --- 👁️ VIEW CONTENT MODE --- */
        ) : viewId && retrievedData ? (
          <div>
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase flex items-center gap-2">
                <FiCheck className="bg-green-400 border-2 border-black rounded-full p-1" /> 
                {isProtected ? 'UNLOCKED' : 'DATA RETRIEVED'}
              </h2>
              <a href="/" className="text-xs font-bold hover:text-red-500">CLOSE X</a>
            </div>

            {/* COUNTDOWN TIMER */}
            <div className="bg-black text-white p-2 mb-6 text-center font-bold border-2 border-black flex justify-center items-center gap-2">
              <FiClock className="text-[#FF4785]" />
              <span>SELF DESTRUCT IN:</span>
              <CountdownTimer expiresAt={retrievedData.expiresAt} />
            </div>
            
            {retrievedData.type === 'text' ? (
               <div className="bg-gray-100 border-4 border-black p-6 text-lg font-bold min-h-[200px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-auto break-words whitespace-pre-wrap">
                 {retrievedData.content}
               </div>
            ) : (
              <div className="text-center py-12 bg-[#E0E7FF] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-6xl mb-4 mx-auto w-fit">📦</div>
                <p className="text-xl font-black mb-6 uppercase px-4 truncate">{retrievedData.filename}</p>
                <a href={`http://localhost:3000/download/${viewId}`} className="inline-flex items-center gap-2 bg-[#FFDE00] border-4 border-black px-6 py-3 text-lg font-black uppercase hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_black] shadow-[6px_6px_0px_0px_black] transition-all">
                  <FiDownload /> Download File
                </a>
              </div>
            )}
            <a href="/" className="block text-center mt-6 font-bold underline hover:text-[#FF4785]">SECURE ANOTHER ITEM</a>
          </div>
        
        /* --- ➕ CREATE MODE --- */
        ) : !generatedLink ? (
          <form onSubmit={handleUpload}>
            <div className="flex border-b-4 border-black mb-6 pb-2 gap-4">
              <button type="button" onClick={() => setActiveTab('text')} className={`flex-1 text-lg font-black uppercase transition-colors flex items-center justify-center gap-2 ${activeTab === 'text' ? 'text-[#FF4785]' : 'text-gray-400'}`}>
                <FiFileText /> Text
              </button>
              <div className="w-[2px] bg-black"></div>
              <button type="button" onClick={() => setActiveTab('file')} className={`flex-1 text-lg font-black uppercase transition-colors flex items-center justify-center gap-2 ${activeTab === 'file' ? 'text-[#22D3EE]' : 'text-gray-400'}`}>
                <FiUpload /> File
              </button>
            </div>

            {/* OPTIONS GRID */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* 1. TIMER INPUT */}
                <div>
                  <label className="block font-bold text-xs uppercase mb-1">Timer (Mins):</label>
                  <div className="flex items-center border-4 border-black shadow-[4px_4px_0px_0px_black]">
                    <input 
                      type="number" 
                      min="1"
                      value={expiration} 
                      onChange={(e) => setExpiration(e.target.value)}
                      className="w-full p-3 font-black text-xl bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. PASSWORD INPUT (NEW) */}
                <div>
                  <label className="block font-bold text-xs uppercase mb-1">Pass (Optional):</label>
                  <div className="flex items-center border-4 border-black shadow-[4px_4px_0px_0px_black]">
                    <input 
                      type="password" 
                      value={uploadPassword} 
                      onChange={(e) => setUploadPassword(e.target.value)}
                      className="w-full p-3 font-black text-xl bg-white focus:outline-none placeholder-gray-300"
                      placeholder="****"
                    />
                  </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="mb-6 h-40 relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'text' ? (
                        <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <textarea className="w-full h-full border-4 border-black p-4 text-lg font-bold focus:outline-none focus:bg-gray-50 resize-none placeholder-gray-400" placeholder="TYPE SECRET INFO..." value={text} onChange={handleTextChange} />
                        </motion.div>
                    ) : (
                        <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                            <label className="h-full flex flex-col items-center justify-center border-4 border-dashed border-black bg-gray-50 hover:bg-[#F0FDFA] cursor-pointer group transition-colors relative overflow-hidden">
                              <FiUpload className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-200" />
                              <span className="font-black uppercase text-lg group-hover:underline">{file ? file.name : "SELECT FILE"}</span>
                              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                            </label>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-black text-white border-4 border-black py-4 text-xl font-black uppercase shadow-[8px_8px_0px_0px_#FF4785] hover:shadow-[4px_4px_0px_0px_#FF4785] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[8px] active:translate-y-[8px] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <FiRefreshCw className="animate-spin" /> : '🔒 ENCRYPT & LOCK'}
            </button>
          </form>
        
        /* --- ✅ SUCCESS MODE --- */
        ) : (
          <div className="text-center py-6">
            <div className="inline-block p-4 border-4 border-black rounded-full mb-6 bg-[#A3E635] shadow-[4px_4px_0px_0px_black]">
              <FiCheck className="text-4xl" />
            </div>
            <h3 className="text-4xl font-black uppercase mb-2">VAULT SEALED</h3>
            <p className="text-sm font-bold bg-black text-white inline-block px-2 py-1 mb-8 transform -rotate-1">
              Valid for {expiration} Minutes
            </p>
            <div className="flex bg-gray-100 border-4 border-black p-2 gap-2 mb-8">
              <input readOnly value={generatedLink} className="bg-transparent border-none text-black w-full font-mono font-bold text-sm outline-none px-2" />
              <button onClick={copyToClipboard} className="bg-black text-white border-2 border-black px-4 font-bold hover:bg-white hover:text-black transition-colors">COPY</button>
            </div>
            <button onClick={() => window.location.reload()} className="text-gray-400 font-bold hover:text-black hover:underline flex items-center justify-center gap-2 mx-auto">
                <FiRefreshCw /> CREATE NEW TRANSFER
            </button>
          </div>
        )}
      </motion.div>
      <div className="mt-12 text-xs font-bold text-gray-400"><span className="flex items-center gap-1"><FiAlertTriangle /> DO NOT SHARE LINKS PUBLICLY</span></div>
    </div>
  );
}

export default App;