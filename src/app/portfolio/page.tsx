import { PageHeader } from "@/components/sections/PageHeader";
import { PortfolioAbout } from "@/components/sections/PortfolioAbout";
import { CaseStudiesGrid } from "@/components/sections/CaseStudiesGrid";
import { CASE_STUDIES } from "@/content/portfolio/case-studies";

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        title="Portfolio"
        subtitle="Quién soy, qué hago, y mis proyectos de impacto"
      />
      <PortfolioAbout />

      <section className="py-20 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
              Proyectos Destacados
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl">
              Casos de estudio de auditorías, análisis de vulnerabilidades y automatización con IA
            </p>
          </div>
          <CaseStudiesGrid cases={CASE_STUDIES} />
        </div>
      </section>
    </>
  );
}
