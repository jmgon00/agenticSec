"use client";

import { useState } from "react";
import Image from "next/image";
import { CaseStudy } from "@/content/portfolio/case-studies";

interface CaseStudiesGridProps {
  cases: CaseStudy[];
}

export const CaseStudiesGrid = ({ cases }: CaseStudiesGridProps) => {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((caseStudy) => (
          <div
            key={caseStudy.id}
            onClick={() => setSelectedCase(caseStudy)}
            className="group cursor-pointer rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden hover:border-cyan-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
          >
            {/* Image Container */}
            <div className="relative w-full h-48 bg-gray-800 overflow-hidden">
              <Image
                src={caseStudy.imageUrl}
                alt={caseStudy.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60" />
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {caseStudy.title}
              </h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {caseStudy.description}
              </p>

              {/* Technologies */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Tecnologías</p>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.technologies.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 text-xs bg-cyan-400/20 text-cyan-300 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Objective */}
              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                <strong>Objetivo:</strong> {caseStudy.objective}
              </p>

              {/* CTA */}
              <button className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-2 group/cta">
                Ver caso completo
                <span className="group-hover/cta:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail View */}
      {selectedCase && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCase(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Image */}
            <div className="relative w-full h-64 bg-gray-800">
              <Image
                src={selectedCase.imageUrl}
                alt={selectedCase.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedCase.title}
                  </h2>
                  {selectedCase.client && (
                    <p className="text-cyan-400">{selectedCase.client}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Project Info Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-gray-700">
                {selectedCase.duration && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Duración</p>
                    <p className="text-white font-semibold">{selectedCase.duration}</p>
                  </div>
                )}
                {selectedCase.role && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Mi Rol</p>
                    <p className="text-white font-semibold">{selectedCase.role}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 uppercase">Estado</p>
                  <p className="text-green-400 font-semibold">Completado ✓</p>
                </div>
              </div>

              {/* Challenge & Solution */}
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Desafío</h3>
                  <p className="text-gray-300">{selectedCase.challenge}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Solución</h3>
                  <p className="text-gray-300">{selectedCase.solution}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Resultados</h3>
                  <p className="text-gray-300">{selectedCase.result}</p>
                </div>
              </div>

              {/* Technologies */}
              <div className="mb-8 pb-8 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4">Tecnologías Utilizadas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCase.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-cyan-400/20 text-cyan-300 rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedCase(null)}
                className="w-full px-6 py-3 bg-cyan-400 text-gray-900 font-semibold rounded-lg hover:bg-cyan-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
