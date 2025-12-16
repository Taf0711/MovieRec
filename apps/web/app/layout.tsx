"use client";

import React from "react";
import Navbar from "../components/Navbar"; 
import { AuthProvider } from "../lib/AuthContext";
import "./globals.css"; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#111827] text-white relative">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen w-full transition-all duration-300">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
