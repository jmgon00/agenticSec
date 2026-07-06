"use client";

import { SecurityService } from "@/lib/types/portfolio";
import { Button } from "@/components/ui/Button";

interface SecurityServiceCardProps {
  service: SecurityService;
  onLearnMore?: (serviceId: string) => void;
}

export const SecurityServiceCard = ({
  service,
  onLearnMore,
}: SecurityServiceCardProps) => {
  return (
    <div className="rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 transition-all duration-300 ease-out hover:border-cyan-500/50">
      {/* Service Icon */}
      <div className="mb-4 text-4xl">{service.icon}</div>

      {/* Service Name */}
      <h3 className="mb-3 text-xl font-bold text-white transition-colors hover:text-cyan-400">
        {service.name}
      </h3>

      {/* Short Description */}
      <p className="mb-6 line-clamp-3 text-sm text-gray-400">
        {service.shortDescription}
      </p>

      {/* Learn More Button */}
      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={() => onLearnMore?.(service.id)}
      >
        Más información
      </Button>
    </div>
  );
};
