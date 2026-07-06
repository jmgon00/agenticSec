"use client";

interface TimelineStep {
  number: number;
  title: string;
  description: string;
}

const PROCESS_STEPS: TimelineStep[] = [
  {
    number: 1,
    title: "Contacto Inicial",
    description: "Conversación para entender tus necesidades y contexto",
  },
  {
    number: 2,
    title: "Diagnóstico",
    description: "Análisis inicial de tu infraestructura y sistemas",
  },
  {
    number: 3,
    title: "Auditoría Completa",
    description: "Evaluación exhaustiva según el servicio contratado",
  },
  {
    number: 4,
    title: "Reporte Detallado",
    description: "Documentación de hallazgos y recomendaciones de remediación",
  },
  {
    number: 5,
    title: "Seguimiento",
    description: "Apoyo en la implementación de mejoras y validación",
  },
];

export const ProcessTimeline = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          Nuestro Proceso de Trabajo
        </h2>

        <div className="space-y-8">
          {PROCESS_STEPS.map((step, index) => (
            <div key={step.number} className="flex gap-6">
              {/* Timeline Column */}
              <div className="flex flex-col items-center">
                {/* Numbered Dot */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-400 to-magenta-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>

                {/* Connecting Line (except for last step) */}
                {index < PROCESS_STEPS.length - 1 && (
                  <div className="w-1 h-12 bg-gradient-to-b from-cyan-400/50 to-transparent mt-4"></div>
                )}
              </div>

              {/* Content Column */}
              <div className="pt-2 pb-8">
                <h3 className="text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
