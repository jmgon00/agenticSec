"use client";

import { HERO } from "@/content/config";

export const Hero = () => {
  return (
    <section className="text-center px-4 py-6 shrink-0">
      <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-magenta-400 to-cyan-400 bg-clip-text text-transparent animate-textGradient bg-[length:200%_auto]">
        {HERO.title}
      </h1>
      <p className="text-base md:text-lg text-gray-300 font-light">
        {HERO.subtitle}
      </p>
    </section>
  );
};
