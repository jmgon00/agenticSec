"use client";

import { useRouter } from "next/navigation";
import { SECURITY_SERVICES } from "@/content/services/security";
import { SecurityServiceCard } from "./SecurityServiceCard";
import { Button } from "@/components/ui/Button";

export const SecurityServices = () => {
  const router = useRouter();

  const handleLearnMore = (serviceId: string) => {
    router.push(`/security-services`);
  };

  const handleViewAll = () => {
    router.push("/security-services");
  };

  return (
    <section
      id="security-services"
      className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 px-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            Servicios de Seguridad para PyMEs
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Protege tu infraestructura y aplicaciones con auditorías profesionales
            de seguridad
          </p>
        </div>

        {/* Services Grid */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {SECURITY_SERVICES.map((service) => (
            <SecurityServiceCard
              key={service.id}
              service={service}
              onLearnMore={handleLearnMore}
            />
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button size="lg" onClick={handleViewAll}>
            Ver todos los servicios
          </Button>
        </div>
      </div>
    </section>
  );
};
