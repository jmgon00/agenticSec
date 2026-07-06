"use client";

import { PageHeader } from "@/components/sections/PageHeader";
import { AgenticIATabs } from "@/components/sections/AgenticIATabs";
import { AgenticIAPortfolioGrid } from "@/components/sections/AgenticIAPortfolioGrid";
import { ConsultationForm } from "@/components/sections/ConsultationForm";
import { AGENTIC_IA_CONTENT } from "@/content/agentic-ia";
import { AGENTIC_IA_PROJECTS } from "@/content/portfolio/agentic-ia";

export default function AgenticIAPage() {
  return (
    <>
      <PageHeader
        title="Proyectos de IA Agentic"
        subtitle="Soluciones autónomas con agentes de inteligencia artificial"
      />

      <AgenticIATabs tabs={AGENTIC_IA_CONTENT} />

      <section className="py-20 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Portafolio de Proyectos
          </h2>
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Explora algunos de nuestros proyectos de IA Agentic más destacados
          </p>
        </div>
        <AgenticIAPortfolioGrid projects={AGENTIC_IA_PROJECTS} />
      </section>

      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <ConsultationForm
            defaultService="ia-inquiry"
            title="Consulta sobre Proyectos de IA"
            submitText="Enviar Consulta"
          />
        </div>
      </section>
    </>
  );
}
