"use client";

import { HERO } from "@/content/config";
import { Button } from "@/components/ui/Button";

export const Hero = () => {
  const scrollToContact = () => {
    const contactSection = document.getElementById("contact");
    contactSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 px-4 pt-20">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          {HERO.title}
        </h1>
        <p className="text-xl text-gray-300 mb-8">{HERO.subtitle}</p>
        <Button onClick={scrollToContact}>{HERO.cta}</Button>
      </div>
    </section>
  );
};
