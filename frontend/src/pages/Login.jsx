import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; 

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Firebase Original Login logic
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      console.log("Logged in successfully:", userCredential.user);
      navigate('/dashboard'); // Success aana ulla pogum
      
    } catch (err) {
      console.error("Login Error:", err);
      setError("Invalid Email or Password!"); 
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert("Google Login will be connected using Firebase");
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl">
              🤖
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Task AI Agent</h1>
              <p className="text-slate-300">Autonomous Productivity Assistant</p>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-white leading-tight">
            Work smarter with
            <span className="text-blue-400"> AI.</span>
          </h2>
          <p className="mt-6 text-slate-300 text-lg leading-8">
            Manage tasks, search the web, check weather, schedule meetings and
            chat with your AI assistant from one place.
          </p>
          <div className="mt-10 flex gap-4">
            <div className="bg-white/10 rounded-xl px-5 py-4">
              <h3 className="text-blue-400 text-xl font-bold">Weather</h3>
              <p className="text-slate-300 text-sm">Real-time updates</p>
            </div>
            <div className="bg-white/10 rounded-xl px-5 py-4">
              <h3 className="text-green-400 text-xl font-bold">Calendar</h3>
              <p className="text-slate-300 text-sm">Smart scheduling</p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 sm:p-12 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
            Welcome Back 
          </h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base tracking-wider mb-10">
            Login to continue using Task AI Agent
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            
            {/* ERROR MESSAGE */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
  
            {/* Email */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm sm:text-base tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && document.getElementById("password").focus()}
                placeholder="Enter your email"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 mb-2 text-sm sm:text-base tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 pr-12 text-white outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex justify-between items-center text-sm sm:text-base mt-2">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="w-5 h-5 rounded bg-slate-900 border-slate-700 cursor-pointer"
                />
                <span className="tracking-wide">Remember Me</span>
              </label>
              <button type="button" className="text-blue-400 hover:text-blue-300 transition-colors tracking-wide">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed transition-all duration-300 text-white py-4 rounded-xl font-bold text-lg tracking-wide"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="flex items-center my-2">
              <div className="flex-1 h-px bg-slate-700"></div>
              <span className="px-4 text-slate-400 text-sm font-medium tracking-wider">OR</span>
              <div className="flex-1 h-px bg-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-slate-600 hover:border-blue-500 hover:bg-slate-800 transition-all duration-300 rounded-xl py-4 flex items-center justify-center gap-3 text-white font-medium text-base sm:text-lg tracking-wide"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-6 h-6 sm:w-7 sm:h-7"
              />
              Continue with Google
            </button>
          </form>

          <div className="mt-8 text-center text-sm sm:text-base">
            <span className="text-slate-400 tracking-wide">Don't have an account?</span>
            <Link to="/signup" className="text-blue-400 ml-2 hover:text-blue-300 transition-colors font-medium tracking-wide">
              Sign Up
            </Link>
          </div>
          <p className="text-center text-slate-500 text-xs sm:text-sm mt-8 tracking-wide">
            Secure Login with Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;