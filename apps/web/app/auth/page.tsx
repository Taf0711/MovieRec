"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/profile");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const { error } = await signIn(email, password);
        if (error) {
          // Provide more helpful error messages
          if (error.message?.includes('Invalid API key') || error.message?.includes('invalid_api_key')) {
            setError("Authentication service not configured. Please contact support.");
          } else if (error.message?.includes('Invalid login credentials')) {
            setError("Invalid email or password. Please try again.");
          } else {
            setError(error.message || "Failed to sign in");
          }
        } else {
          router.push("/profile");
        }
      } else {
        // Sign Up
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        
        if (password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }

        const { error } = await signUp(email, password);
        if (error) {
          // Provide more helpful error messages
          if (error.message?.includes('Invalid API key') || error.message?.includes('invalid_api_key')) {
            setError("Authentication service not configured. Please contact support.");
          } else {
            setError(error.message || "Failed to sign up");
          }
        } else {
          setMessage("Check your email for a confirmation link!");
          setEmail("");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#242730] font-sans px-4">
      <main className="flex flex-col items-center justify-center p-8 bg-[#1E1E2E] rounded-xl shadow-2xl w-full max-w-md border border-white/10">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          {isLogin ? "Sign in to continue to MovieRec" : "Join MovieRec today"}
        </p>

        {error && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {message && (
          <div className="w-full mb-4 p-3 bg-green-500/10 border border-green-500/40 rounded-lg">
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-3 rounded-lg bg-[#2a2d3a] border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:border-[#58b8ff] transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full p-3 rounded-lg bg-[#2a2d3a] border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:border-[#58b8ff] transition-colors"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full p-3 rounded-lg bg-[#2a2d3a] border border-gray-600/60 text-white placeholder-gray-500 focus:outline-none focus:border-[#58b8ff] transition-colors"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg font-semibold text-white bg-[#58b8ff] hover:bg-[#4aa8ee] disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? "Signing in..." : "Creating account..."}</span>
              </>
            ) : (
              <span>{isLogin ? "Sign In" : "Sign Up"}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-[#58b8ff] hover:text-[#4aa8ee] font-semibold transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError(null);
                    setMessage(null);
                  }}
                  className="text-[#58b8ff] hover:text-[#4aa8ee] font-semibold transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
