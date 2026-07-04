import { DEMOS } from "@/content/config";
import { DemoCard } from "@/components/ui/DemoCard";

export const Demos = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-dark-base to-gray-900 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">
          Demos de Agentes IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {DEMOS.map((demo) => (
            <DemoCard
              key={demo.id}
              title={demo.title}
              description={demo.description}
              embedUrl={demo.embedUrl}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
