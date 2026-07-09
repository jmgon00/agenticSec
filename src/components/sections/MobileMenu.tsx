"use client";

import Link from "next/link";

interface MobileMenuLink {
  href: string;
  label: string;
}

interface MobileMenuProps {
  links: MobileMenuLink[];
  open: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ links, open, onClose }: MobileMenuProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className="absolute top-0 right-0 h-full w-64 bg-gray-950 border-l border-gray-800 flex flex-col p-6 gap-2">
        <button
          type="button"
          aria-label="Cerrar menú"
          className="self-end text-white hover:text-cyan-400 mb-4 text-2xl leading-none transition-colors duration-200"
          onClick={onClose}
        >
          ×
        </button>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-gray-300 hover:text-cyan-400 px-2 py-3 rounded transition-colors duration-200 text-lg"
            onClick={onClose}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
