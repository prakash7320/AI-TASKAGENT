import React, { useState, useRef, useEffect } from 'react';
import { 
  FiMessageSquare, FiClock, FiCpu, FiUser, 
  FiBell, FiSettings, FiPaperclip, FiMic, 
  FiSend, FiCloudRain, FiCalendar, FiChevronRight,
  FiMenu, FiX, FiThumbsUp, FiThumbsDown, FiCopy, FiRefreshCw, 
  FiVolume2, FiXCircle, FiImage, 
  FiTrash2, FiEdit2, FiCheck, FiInfo, FiVolumeX 
} from 'react-icons/fi';
import { FaBolt } from 'react-icons/fa';

import { db } from '../firebase'; 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, deleteDoc, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false); 
  const [activeView, setActiveView] = useState("chat"); 
  
  // 🚨 USER AUTH & LOGOUT LOGIC
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/"); 
      }
    });
    return () => unsubscribe();
  }, [navigate, auth]);

  const handleSignOut = () => {
    signOut(auth).then(() => navigate("/"));
  };
  
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleText, setEditTitleText] = useState("");

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false); 
  const chatEndRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  
  const [weatherData, setWeatherData] = useState(() => {
    const savedWeather = localStorage.getItem("weatherData");
    return savedWeather ? JSON.parse(savedWeather) : {temp:"--",location:"Loading...",feelsLike:"--",wind:"--",humidity:"--",sunrise:"--",sunset:"--"};
  });

  const [upcomingMeetings, setUpcomingMeetings] = useState(() => {
    const savedMeetings = localStorage.getItem("upcomingMeetings");
    return savedMeetings ? JSON.parse(savedMeetings) : [];
  });

  useEffect(() => localStorage.setItem("weatherData", JSON.stringify(weatherData)), [weatherData]);
  useEffect(() => localStorage.setItem("upcomingMeetings", JSON.stringify(upcomingMeetings)), [upcomingMeetings]);

  useEffect(() => {
    const q = query(collection(db, "chatSessions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChatSessions(sessions);
      if (sessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(sessions[0].id);
      }
    });
    return () => unsubscribe();
  }, [currentSessionId]);

  useEffect(() => {
    if (!currentSessionId) {
      setMessages([]);
      return;
    }
    const q = query(collection(db, "chats"), where("sessionId", "==", currentSessionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      loadedMessages.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      setMessages(loadedMessages);
    });
    return () => unsubscribe();
  }, [currentSessionId]);

  useEffect(() => {
    if (activeView === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, activeView]);

  const createNewChat = async () => {
    setActiveView("chat"); 
    const docRef = await addDoc(collection(db, "chatSessions"), {
      title: "New Chat",
      createdAt: serverTimestamp()
    });
    setCurrentSessionId(docRef.id);
  };

  const deleteChat = async (id, e) => {
    e.stopPropagation();
    try {
      const messagesQuery = query(collection(db, "chats"), where("sessionId", "==", id));
      const querySnapshot = await getDocs(messagesQuery);
      
      querySnapshot.forEach(async (messageDoc) => {
        await deleteDoc(doc(db, "chats", messageDoc.id));
      });

      await deleteDoc(doc(db, "chatSessions", id));
      
      if (currentSessionId === id) setCurrentSessionId(null);
    } catch (error) {
      console.error("Error deleting chat: ", error);
    }
  };

  const startEditing = (session, e) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleText(session.title);
  };

  const saveEdit = async (id, e) => {
    e.stopPropagation();
    if (editTitleText.trim()) {
      await updateDoc(doc(db, "chatSessions", id), { title: editTitleText });
    }
    setEditingSessionId(null);
  };

  const renderTextWithLinks = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => part.match(urlRegex) ? <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300 font-medium">{part}</a> : part);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(text.replace(/(https?:\/\/[^\s]+)/g, "link provided"));
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🚨 STOP AUDIO FUNCTION
  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSendMessage = async () => {
    if (!inputText.trim() && !selectedFile) return; 

    const userText = inputText || "File Attached 📎";
    const fileName = selectedFile ? selectedFile.name : null;
    const msgTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12:true });

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const docRef = await addDoc(collection(db, "chatSessions"), {
        title: userText.substring(0, 20) + (userText.length > 20 ? "..." : ""),
        createdAt: serverTimestamp()
      });
      activeSessionId = docRef.id;
      setCurrentSessionId(activeSessionId);
    }

    const currentSession = chatSessions.find(s => s.id === activeSessionId);
    if (currentSession && currentSession.title === "New Chat") {
       await updateDoc(doc(db, "chatSessions", activeSessionId), { title: userText.substring(0, 20) + "..." });
    }

    await addDoc(collection(db, "chats"), {
      sessionId: activeSessionId,
      role: "user",
      text: userText,
      fileName: fileName,
      time: msgTime,
      createdAt: serverTimestamp() 
    });
    
    setInputText(""); 
    setIsTyping(true);

    let fileBase64 = null;
    if (selectedFile) {
      fileBase64 = await toBase64(selectedFile);
      setSelectedFile(null); 
    }

    try {
      const response = await fetch("https://ai-taskagent.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, file: fileBase64 }),
      });

      const data = await response.json();

      if (data.reply) {
        await addDoc(collection(db, "chats"), {
          sessionId: activeSessionId,
          role: "ai",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit',hour12:true}),
          createdAt: serverTimestamp()
        });
        
        if (isVoiceMode) speakText(data.reply); 
        if (data.weatherData) setWeatherData(data.weatherData); 
        if (data.calendarData) setUpcomingMeetings(prev => [data.calendarData, ...prev]); 
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setIsTyping(false);
      setIsVoiceMode(false); 
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser doesn't support voice input. Try Chrome.");
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? prev + " " + transcript : transcript));
      setIsVoiceMode(true); 
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="flex h-screen bg-[#0F111A] text-slate-300 font-sans overflow-hidden">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* ================= LEFT SIDEBAR ================= */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 flex flex-col justify-between bg-[#0A0D14] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="overflow-y-auto h-full pb-4 scrollbar-hide">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400"><FaBolt size={20} /></div>
              <div><h1 className="text-white font-bold text-lg tracking-wide leading-tight">Task AI Agent</h1></div>
            </div>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}><FiX size={24} /></button>
          </div>
          
          <div className="px-4 mb-6">
            <button onClick={createNewChat} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] transition-all shadow-lg rounded-xl py-3 px-4 flex items-center justify-center gap-3 font-medium text-white">
              <FiMessageSquare size={18} /> New Chat
            </button>
          </div>
          
          <div className="px-4 mb-6">
            <h3 className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-3 flex items-center gap-2"><FiClock size={12}/> Chat History</h3>
            <div className="space-y-1.5">
              {chatSessions.length === 0 ? (
                 <p className="text-xs text-slate-500 px-3 py-2 italic">No chats yet...</p>
              ) : (
                chatSessions.map((session) => (
                  <div key={session.id} onClick={() => {setCurrentSessionId(session.id); setActiveView("chat"); setIsSidebarOpen(false);}} className={`group relative flex items-center justify-between w-full text-left text-sm rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${currentSessionId === session.id && activeView === "chat" ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                    
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-2 w-full">
                         <input autoFocus type="text" value={editTitleText} onChange={(e) => setEditTitleText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(session.id, e)} className="bg-transparent border-b border-cyan-400 text-white outline-none w-full text-sm" />
                         <button onClick={(e) => saveEdit(session.id, e)} className="text-cyan-400"><FiCheck size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate pr-16 capitalize">{session.title}</span>
                        {/* Mobile-Friendly Edit & Delete Buttons */}
                        <div className={`absolute right-2 flex items-center gap-3 pl-2 transition-opacity ${currentSessionId === session.id ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}`}>
                          <button onClick={(e) => startEditing(session, e)} className="text-slate-400 hover:text-cyan-400 p-1"><FiEdit2 size={16}/></button>
                          <button onClick={(e) => deleteChat(session.id, e)} className="text-slate-400 hover:text-red-400 p-1"><FiTrash2 size={16}/></button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <nav className="px-4 space-y-2 border-t border-slate-800/50 pt-4">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors text-sm"><FiCpu size={18} /> Memory</button>
            <button onClick={() => {setActiveView("profile"); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm ${activeView === "profile" ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <FiUser size={18} /> Profile
            </button>
          </nav>

        </div>
      </div>

      {/* ================= CENTER MAIN AREA ================= */}
      <div className="flex-1 flex flex-col bg-[#131620] w-full relative">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 h-full">
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(true)}><FiMenu size={24} /></button>
            <div className="hidden sm:flex gap-6 h-full">
              <button onClick={() => setActiveView("task")} className={`text-sm font-medium h-full px-2 ${activeView === "task" ? 'text-white border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>Task Orchestration</button>
              <button onClick={() => setActiveView("chat")} className={`text-sm font-medium h-full px-2 ${activeView === "chat" ? 'text-white border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>AI Status</button>
              <button onClick={() => setActiveView("profile")} className={`text-sm font-medium h-full px-2 ${activeView === "profile" ? 'text-white border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>Profile</button>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-4">
            
            <button className="lg:hidden text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/20" onClick={() => setIsRightSidebarOpen(true)}>
              <FiInfo size={16} /> <span className="text-xs font-medium">Widgets</span>
            </button>

            <button className="hidden sm:block text-slate-400 hover:text-white"><FiSettings size={20} /></button>
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 overflow-hidden cursor-pointer" onClick={() => setActiveView("profile")}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
            </div>
          </div>
        </header>

        {activeView === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
              {messages.length === 0 && !isTyping && (
                 <div className="flex flex-col items-center justify-center h-full opacity-60">
                   <FaBolt size={48} className="text-blue-500 mb-4" />
                   <h2 className="text-2xl font-bold text-white mb-2 text-center">How can I help you?</h2>
                   <p className="text-slate-400 text-sm text-center max-w-md px-4">Type, speak, or upload an image to chat with your AI.</p>
                 </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3 sm:gap-4'} w-full`}>
                  {msg.role === 'ai' && <div className="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center text-white mt-1 text-sm sm:text-base">🤖</div>}
                  <div className={`${msg.role === 'user' ? 'bg-slate-800/80 border border-slate-700/50 text-slate-200 p-4 rounded-2xl rounded-tr-sm w-full max-w-[90%] sm:max-w-[80%] shadow-lg' : 'flex-1 overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/50 p-4 sm:p-5 rounded-2xl rounded-tl-sm text-sm text-slate-300 shadow-xl max-w-[95%] sm:max-w-[90%]'}`}>
                    {msg.fileName && (
                      <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg mb-3 border border-slate-700 w-fit">
                        <FiImage className="text-cyan-400" size={16}/><span className="text-xs text-slate-300">{msg.fileName}</span>
                      </div>
                    )}
                    <div className={`leading-relaxed ${msg.role === 'ai' ? 'text-white mb-4' : 'text-sm'} whitespace-pre-wrap`}>
                      {renderTextWithLinks(msg.text)} 
                    </div>
                    {msg.role === 'user' && <span className="text-[10px] text-slate-500 mt-2 block text-right">{msg.time}</span>}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4 max-w-[90%]"><div className="w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0 flex items-center justify-center text-white mt-1">🤖</div><div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5"><span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span><span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span></div></div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 sm:p-6 pt-2 relative">
              {selectedFile && (
                <div className="absolute -top-6 left-6 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-3 text-sm text-slate-300 shadow-lg animate-fade-in-up">
                  <FiImage className="text-cyan-400" /><span className="max-w-[200px] truncate">{selectedFile.name}</span>
                  <button onClick={() => setSelectedFile(null)} className="text-red-400 hover:text-red-300 transition-colors"><FiXCircle size={16} /></button>
                </div>
              )}
              <div className="relative flex items-center bg-slate-800/50 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
                <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="pl-4 pr-2 text-slate-400 hover:text-cyan-400"><FiPaperclip size={18} /></button>
                <input 
                  type="text" value={inputText}
                  onChange={(e) => { setInputText(e.target.value); setIsVoiceMode(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..." 
               