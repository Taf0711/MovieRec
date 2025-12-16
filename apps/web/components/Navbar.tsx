"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, User, Home, Film, Book, Star, Sparkles } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();

  const publicLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Movies", href: "/movies", icon: Film },
    { name: "Books", href: "/books", icon: Book },
    { name: "Recommendations", href: "/recommend", icon: Sparkles },
  ];

  const authLinks = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Reviews", href: "/reviews", icon: Star },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push("/");
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 text-white bg-[#000033] p-2 rounded-md focus:outline-none hover:bg-[#000055] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-300 ${
          isOpen ? "opacity-40 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-[#0B0B3B] shadow-xl flex flex-col p-6 z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#58b8ff] rounded-lg flex items-center justify-center">
            <Film size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MovieRec</h1>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-6 p-3 bg-[#000055]/50 rounded-lg">
            <p className="text-sm text-gray-400">Signed in as</p>
            <p className="text-white font-medium truncate">{user.email}</p>
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {/* Public Links */}
          {publicLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 py-2.5 px-4 rounded-lg text-white transition ${
                    isActive
                      ? "bg-[#58b8ff] text-white font-semibold"
                      : "hover:bg-[#000055]"
                  }`}
                >
                  <Icon size={18} />
                  {link.name}
                </Link>
              </li>
            );
          })}

          {/* Auth-required Links */}
          {user && (
            <>
              <li className="my-2 border-t border-gray-600/50"></li>
              {authLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 py-2.5 px-4 rounded-lg text-white transition ${
                        isActive
                          ? "bg-[#58b8ff] text-white font-semibold"
                          : "hover:bg-[#000055]"
                      }`}
                    >
                      <Icon size={18} />
                      {link.name}
                    </Link>
                  </li>
                );
              })}
            </>
          )}
        </ul>

        {/* Auth Button */}
        <div className="mt-auto">
          {loading ? (
            <div className="py-2.5 px-4 text-gray-400 text-center">
              Loading...
            </div>
          ) : user ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          ) : (
            <Link
              href="/auth"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#58b8ff] hover:bg-[#4aa8ee] text-white font-semibold rounded-lg transition"
            >
              <User size={18} />
              Sign In
            </Link>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
