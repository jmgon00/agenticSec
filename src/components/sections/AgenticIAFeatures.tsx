"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

const features = [
  {
    id: "automation",
    icon: "⚙️",
    title: "Automatización Inteligente",
    description: "IA que trabaja 24/7 sin intervención humana, ejecutando tareas complejas de forma autónoma.",
  },
  {
    id: "real-time",
    icon: "⚡",
    title: "Análisis en Tiempo Real",
    description: "Procesa datos de seguridad al instante, identificando amenazas antes de que causen daño.",
  },
  {
    id: "reports",
    icon: "📊",
    title: "Reportes Automáticos",
    description: "Genera informes de compliance y seguridad sin esfuerzo manual, siempre actualizados.",
  },
  {
    id: "scalability",
    icon: "📈",
    title: "Escalabilidad",
    description: "Maneja múltiples tareas simultáneamente, creciendo con tu organización sin límites.",
  },
];

export const AgenticIAFeatures = () => {
  return (
    <section id="agentic-ia" className="py-20 bg-gradient-to-b from-gray-900 to-dark-base px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-4 text-center">
          Agentic IA
        </h2>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Automatización inteligente para seguridad. Agentes autónomos que trabajan para ti.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-gray-900/50 backdrop-blur-lg border border-gray-800 rounded-lg p-6 hover:border-cyan-400 hover:shadow-cyan-lg transition-all duration-200 ease-out"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/agentic-ia">
            <Button size="lg">
              Explorar Agentic IA →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
