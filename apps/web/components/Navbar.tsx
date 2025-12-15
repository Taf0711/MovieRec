"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/" },
    { name: "Sign In / Sign Up", href: "/auth" },
    { name: "Profile", href: "/profile" },
    { name: "Movies Page", href: "/movies" },
    { name: "Review Page", href: "/reviews" },
    { name: "Books Page", href: "/books" },
    { name: "Recommendations", href: "/recommend" },
  ];

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 text-white bg-[#000033] p-2 rounded-md focus:outline-none"
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
        <h1 className="text-2xl font-bold mb-8 text-white">MovieRec</h1>

        <ul className="flex flex-col gap-3">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2 px-4 rounded-lg text-white transition ${
                    isActive
                      ? "bg-pink-500 text-white font-semibold"
                      : "hover:bg-[#000055]"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Logout Button */}
        <button className="mt-auto py-2 px-4 bg-[#111155] rounded text-white hover:bg-[#222277] transition">
          Logout
        </button>
      </nav>
    </>
  );
};

export default Navbar;
