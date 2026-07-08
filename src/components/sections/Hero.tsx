"use client";

import { HERO } from "@/content/config";

export const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-base via-gray-950 to-gray-900 px-4 pt-20 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full opacity-50 animate-float" style={{animationDelay: "0s"}}></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-magenta-400 rounded-full opacity-50 animate-float" style={{animationDelay: "2s"}}></div>
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-cyan-400 rounded-full opacity-50 animate-float" style={{animationDelay: "4s"}}></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-accent rounded-full opacity-40 animate-float" style={{animationDelay: "1s"}}></div>
      </div>

      <div className="text-center max-w-3xl relative z-10">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-magenta-400 to-cyan-400 bg-clip-text text-transparent animate-textGradient bg-[length:200%_auto]">
          {HERO.title}
        </h1>
        <p className="text-lg md:text-xl text-gray-300 font-light">
          {HERO.subtitle}
        </p>
      </div>
    </section>
  );
};
