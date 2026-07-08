import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AgentesPage() {
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
              <div className="grid md:grid-cols-2">
                {/* Preview/Iframe */}
                <div className="bg-black border-r border-gray-700 h-80">
                  <iframe
                    src="https://prode-mundial-2026-frontend-production.up.railway.app/"
                    title="Prode Mundialista Preview"
                    className="w-full h-full border-none"
                    style={{ pointerEvents: "none" }}
                  />
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col justify-center">
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Prode Mundialista
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    Aplicativo lúdico sin fines de lucro con fixture interactivo para la Copa Mundial 2026. Desarrollado completamente con Claude AI utilizando metodología agentic.
                  </p>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">Next.js</span>
                    <span className="text-xs bg-magenta-500/20 text-magenta-400 px-2 py-1 rounded">React</span>
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Claude AI</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Railway</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <a
                      href="https://prode-mundial-2026-frontend-production.up.railway.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Abrir App ↗
                    </a>
                    <a
                      href="https://github.com/jmgon00/prode-mundial-2026"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-magenta-400 hover:text-magenta-300 transition-colors"
                    >
                      Ver Código →
                    </a>
                  </div>
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
