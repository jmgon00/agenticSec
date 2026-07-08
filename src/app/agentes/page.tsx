"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function AgentesPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const screenshots = [
    { src: "/projects/prode-screenshots/1.png", label: "Home" },
    { src: "/projects/prode-screenshots/2.png", label: "Crear Liga" },
    { src: "/projects/prode-screenshots/3.png", label: "Fixture de Partidos" },
    { src: "/projects/prode-screenshots/4.png", label: "Predicciones" },
    { src: "/projects/prode-screenshots/5.png", label: "Ranking" },
    { src: "/projects/prode-screenshots/6.png", label: "Admin Panel", isAdmin: true },
    { src: "/projects/prode-screenshots/7.png", label: "Admin Gestión", isAdmin: true },
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-base via-gray-950 to-gray-900 px-4 pt-20">
      <div className="text-center max-w-3xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-magenta-400 to-cyan-400 bg-clip-text text-transparent">
            Agentes de IA
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light mb-8">
            Explora agentes inteligentes diseñados para educar y potenciar tu trabajo en seguridad.
            Desde tutoriales interactivos hasta herramientas de análisis profesional.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-cyan-400/50 transition-colors">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">Educativo</h3>
            <p className="text-gray-400 text-sm">
              Aprende conceptos de seguridad con tutores inteligentes
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-magenta-400/50 transition-colors">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-semibold text-white mb-2">Productivo</h3>
            <p className="text-gray-400 text-sm">
              Herramientas profesionales para análisis y reportes
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-cyan-400/50 transition-colors">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold text-white mb-2">Rápido</h3>
            <p className="text-gray-400 text-sm">
              Accede al poder de Claude AI instantáneamente
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-16 border-t border-gray-700"></div>

        {/* Projects Section */}
        <div className="text-left mb-12">
          <h2 className="text-4xl font-bold mb-4 text-white text-center">
            Proyectos Realizados con Claude
          </h2>
          <p className="text-gray-400 text-center mb-8">
            Aplicativos creados utilizando Claude AI y la metodología de desarrollo agentic
          </p>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Prode Mundialista */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 md:col-span-2">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-b border-gray-700">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Prode Mundialista
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Aplicativo lúdico sin fines de lucro con fixture interactivo para la Copa Mundial 2026. Los usuarios pueden crear ligas, hacer predicciones y competir con otros jugadores. Desarrollado completamente con Claude AI.
                </p>
              </div>

              {/* Carrusel */}
              <div className="p-6">
                {/* Main Image */}
                <div className="relative mb-6 bg-black rounded-lg overflow-hidden border border-gray-700">
                  <img
                    src={screenshots[currentImageIndex].src}
                    alt={screenshots[currentImageIndex].label}
                    className="w-full h-auto max-h-96 object-cover"
                  />

                  {/* Admin badge */}
                  {screenshots[currentImageIndex].isAdmin && (
                    <div className="absolute top-4 right-4 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      🔐 ADMIN
                    </div>
                  )}

                  {/* Image counter */}
                  <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {screenshots.length}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-cyan-500/80 hover:bg-cyan-400 text-white p-2 rounded-full transition-colors"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-cyan-500/80 hover:bg-cyan-400 text-white p-2 rounded-full transition-colors"
                  >
                    →
                  </button>
                </div>

                {/* Screenshot label */}
                <p className="text-center text-gray-400 text-sm mb-4 font-semibold">
                  {screenshots[currentImageIndex].label}
                </p>

                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                  {screenshots.map((screenshot, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-cyan-400 shadow-lg shadow-cyan-500/50"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                    >
                      <img
                        src={screenshot.src}
                        alt={screenshot.label}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Features & Links */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-semibold">CARACTERÍSTICAS:</p>
                    <ul className="text-gray-400 text-xs space-y-1">
                      <li>✓ Crear y compartir ligas</li>
                      <li>✓ Predicciones en tiempo real</li>
                      <li>✓ Ranking de participantes</li>
                      <li>✓ Panel administrativo</li>
                    </ul>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs mb-2 font-semibold">TECH STACK:</p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">Next.js</span>
                      <span className="text-xs bg-magenta-500/20 text-magenta-400 px-2 py-1 rounded">React</span>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Claude AI</span>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Railway</span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3 flex-wrap mt-4">
                  <a
                    href="https://prode-mundial-2026-frontend-production.up.railway.app/leagues/d1dd7258-49f3-46af-a4e0-c247a28e3fc9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Ver Demo en Vivo ↗
                  </a>
                  <a
                    href="https://github.com/jmgon00/prode-mundial-2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-magenta-500/20 text-magenta-400 hover:bg-magenta-500/30 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Ver Código →
                  </a>
                </div>
              </div>
            </div>

            {/* Placeholder for future projects */}
            <div className="bg-gray-800/30 border border-dashed border-gray-600 rounded-lg overflow-hidden p-12 flex flex-col items-center justify-center hover:border-magenta-400/50 transition-all duration-300 md:col-span-2">
              <div className="text-5xl mb-4">+</div>
              <h3 className="text-2xl font-semibold text-gray-400 mb-2">
                Próximos Proyectos
              </h3>
              <p className="text-gray-500 text-sm text-center">
                Más aplicativos desarrollados con Claude AI próximamente
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-12 border-t border-gray-700"></div>

        {/* CTA Button */}
        <Link href="/agents">
          <Button size="lg" className="bg-gradient-to-r from-cyan-400 to-magenta-400 hover:from-cyan-300 hover:to-magenta-300">
            Explorar Galería de Agentes 🤖
          </Button>
        </Link>

        {/* Footer text */}
        <p className="mt-8 text-gray-500 text-sm">
          Construído sobre Next.js, Prisma y Claude AI
        </p>
      </div>
    </section>
  );
}
