"use client";

import { ABOUT_ME, CERTIFICATIONS } from "@/content/portfolio/about-me";

export const PortfolioAbout = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
      <div className="max-w-4xl mx-auto">
        {/* About Me Section */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            Sobre Mí
          </h2>

          {/* Profile Picture Placeholder */}
          <div className="mb-8 flex justify-center">
            <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-cyan-400/30 flex items-center justify-center">
              <span className="text-gray-500 text-sm">Foto de perfil (próximamente)</span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-lg text-gray-300 mb-6 leading-relaxed">
            {ABOUT_ME.bio}
          </p>

          {/* Skills in Prose Format */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Expertise Técnico</h3>
            <p className="text-gray-400 leading-relaxed">
              {ABOUT_ME.skills}
            </p>
          </div>

          {/* Focus Areas */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Áreas de Especialización</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ABOUT_ME.focusAreas.map((area, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold mt-1">→</span>
                  <span className="text-gray-300">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Certifications Section */}
        <div className="border-t border-gray-800 pt-16">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            Certificaciones
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.title}
                className="rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 hover:border-cyan-400/50 transition-all duration-200"
              >
                <div className="mb-3 text-3xl">🏆</div>
                <h3 className="text-lg font-bold text-white mb-2">{cert.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{cert.issuer}</p>
                <p className="text-xs text-cyan-400">{cert.year}</p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline mt-3 inline-block"
                  >
                    Ver credencial →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
