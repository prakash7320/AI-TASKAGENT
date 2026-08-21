import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBolt, FaGoogle } from 'react-icons/fa';
import { FiMail, FiLock, FiUser, FiArrowRight } from 'react-icons/fi';

// Firebase imports add pannirukom
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Unga firebase.js path-a inga check pannikonga

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Firebase error kaata puthu state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Firebase Original Account Creation
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );
      
      console.log("Account created successfully:", userCredential.user);
      
      // Success aana udane Dashboard-ku poirum
      navigate('/dashboard');
    } catch (err) {
      console.error("Signup Error:", err);
      // Firebase tharra error-a UI-la kaatanum
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F111A] flex items-center justify-center p-4 font-sans text-slate-300">
      
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-blue-400 mb-6 shadow-xl shadow-blue-900/20">
            <FaBolt size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Create Account</h1>
          <p className="text-slate-500">Join Task AI Agent today</p>
        </div>

        {/* Form Container */}
        <div className="bg-[#131620]/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          
          {/* Error Message Box */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-widest uppercase pl-1">Full Name</label>
              <div className="relative flex items-center bg-slate-800/50 border border-slate-700/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-400 transition-all">
                <div className="pl-4 text-slate-500"><FiUser size={18} /></div>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe" 
                  className="w-full bg-transparent py-3 px-3 text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-widest uppercase pl-1">Email Address</label>
              <div className="relative flex items-center bg-slate-800/50 border border-slate-700/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-400 transition-all">
                <div className="pl-4 text-slate-500"><FiMail size={18} /></div>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@company.com" 
                  className="w-full bg-transparent py-3 px-3 text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-widest uppercase pl-1">Password</label>
              <div className="relative flex items-center bg-slate-800/50 border border-slate-700/80 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-cyan-400 transition-all">
                <div className="pl-4 text-slate-500"><FiLock size={18} /></div>
                <input 
                  type="password" 
                  name="password"
                  required
                  minLength="6"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••" 
                  className="w-full bg-transparent py-3 px-3 text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-[1.02] transition-transform duration-300 shadow-lg shadow-blue-600/20 text-white font-medium py-3.5 rounded-xl mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
              {!isLoading && <FiArrowRight size={18} />}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;