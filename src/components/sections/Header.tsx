"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/presupuesto", label: "Presupuesto" },
  { href: "/agentes", label: "Agentes 🤖" },
  { href: "/agentic-ia", label: "Agentic IA" },
  { href: "/security-services", label: "Servicios de Seguridad" },
];

export const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-white hover:text-cyan-400 font-bold text-xl transition-colors duration-200">
              AgenticSec
            </Link>

            <button
              type="button"
              aria-label="Abrir menú"
              className="text-white hover:text-cyan-400 transition-colors duration-200"
              onClick={() => setMenuOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu links={navLinks} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};
