"use client";

import { useState } from "react";
import { PageHeader } from "@/components/sections/PageHeader";
import { ProcessTimeline } from "@/components/sections/ProcessTimeline";
import { ConsultationForm } from "@/components/sections/ConsultationForm";
import { SECURITY_SERVICES } from "@/content/services/security";
import { SECURITY_CASES } from "@/content/portfolio/security-cases";

export default function SecurityServicesPage() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const basicAuditService = SECURITY_SERVICES.find((s) => s.id === "basic-audit");
  const otherServices = SECURITY_SERVICES.filter((s) => s.id !== "basic-audit");

  const [selectedPoints, setSelectedPoints] = useState<boolean[]>(
    basicAuditService?.whatIncludes.map(() => true) ?? []
  );

  const togglePoint = (index: number) => {
    setSelectedPoints((prev) =>
      prev.map((value, i) => (i === index ? !value : value))
    );
  };

  const toggleService = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
  };

  return (
    <main>
      {/* 1. PageHeader Section */}
      <PageHeader
        title="Servicios de Seguridad para PyMEs"
        subtitle="Auditorías profesionales de seguridad para proteger tu infraestructura y aplicaciones"
      />

      {/* 2. Services Catalog Section */}
      <section className="bg-gray-950 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Nuestros Servicios
          </h2>

          <div className="space-y-6">
            {/* Basic Audit — featured, interactive card (real scan request, not just an example) */}
            {basicAuditService && (
              <div className="rounded-lg border-2 border-cyan-500/60 bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                <div className="flex items-start gap-6">
                  <div className="text-5xl flex-shrink-0">{basicAuditService.icon}</div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">
                        {basicAuditService.name}
                      </h3>
                      <span className="text-xs font-semibold uppercase tracking-wide text-cyan-400 border border-cyan-500/60 rounded-full px-3 py-1">
                        Solicitá tu escaneo
                      </span>
                    </div>
                    <p className="text-gray-300 mb-6">
                      {basicAuditService.fullDescription}
                    </p>

                    <h4 className="text-lg font-bold text-white mb-3">
                      Elegí los puntos que querés que escaneemos
                    </h4>
                    <ul className="space-y-3 mb-6">
                      {basicAuditService.whatIncludes.map((item, index) => (
                        <li key={index}>
                          <label className="flex items-start gap-3 text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPoints[index] ?? true}
                              onChange={() => togglePoint(index)}
                              className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span>{item}</span>
                          </label>
                        </li>
                      ))}
                    </ul>

                    <div>
                      <h4 className="text-lg font-bold text-white mb-3">
                        ¿Para quién es?
                      </h4>
                      <p className="text-gray-300">{basicAuditService.forWho}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {otherServices.map((service) => (
              <div
                key={service.id}
                className="rounded-lg border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-8 transition-all duration-300"
              >
                {/* Service Header */}
                <div className="flex items-start gap-6">
                  {/* Icon */}
                  <div className="text-5xl flex-shrink-0">{service.icon}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {service.name}
                    </h3>
                    <p className="text-gray-300 mb-4">
                      {service.fullDescription}
                    </p>

                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleService(service.id)}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
                    >
                      {expandedService === service.id ? "Ver menos" : "Ver detalles"}
                    </button>

                    {/* Expanded Details */}
                    {expandedService === service.id && (
                      <div className="mt-6 space-y-6 pt-6 border-t border-gray-700">
                        {/* What Includes */}
                        <div>
                          <h4 className="text-lg font-bold text-white mb-3">
                            ¿Qué incluye?
                          </h4>
                          <ul className="space-y-2">
                            {service.whatIncludes.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-gray-300"
                              >
                                <span className="text-cyan-400 flex-shrink-0">
                                  •
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* For Who */}
                        <div>
                          <h4 className="text-lg font-bold text-white mb-3">
                            ¿Para quién es?
                          </h4>
                          <p className="text-gray-300">{service.forWho}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Success Cases Section */}
      <section className="bg-gray-900 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Casos de Éxito
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {SECURITY_CASES.map((caseItem) => (
              <div
                key={caseItem.id}
                className="rounded-lg border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 p-6"
              >
                <h3 className="text-xl font-bold text-white mb-3">
                  {caseItem.title}
                </h3>
                <p className="text-gray-300 mb-4">{caseItem.description}</p>

                {/* Results if available */}
                {caseItem.content?.results && (
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-cyan-400 mb-2">
                      Resultados:
                    </h4>
                    <ul className="space-y-1">
                      {caseItem.content.results.map((result, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-gray-300"
                        >
                          <span className="text-cyan-400 flex-shrink-0">
                            •
                          </span>
                          <span>{result}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benchmarks if available */}
                {caseItem.content?.benchmarks && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {Object.entries(caseItem.content.benchmarks).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded border border-gray-700 bg-gray-800/60 p-3"
                      >
                        <div className="text-xs text-gray-400 mb-1">{key}</div>
                        <div className="text-lg font-bold text-cyan-400">{value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Report links if available */}
                {(caseItem.content?.clientReportUrl || caseItem.content?.technicalReportUrl) && (
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                    {caseItem.content.clientReportUrl && (
                      <a
                        href={caseItem.content.clientReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 border border-cyan-500/60 rounded-full px-4 py-2 hover:bg-cyan-400 hover:text-dark-base transition-colors"
                      >
                        Ver presentación para cliente ↗
                      </a>
                    )}
                    {caseItem.content.technicalReportUrl && (
                      <a
                        href={caseItem.content.technicalReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-magenta-400 border border-magenta-500/60 rounded-full px-4 py-2 hover:bg-magenta-400 hover:text-white transition-colors"
                      >
                        Ver reporte técnico ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Process Timeline Section */}
      <ProcessTimeline />

      {/* 5. Consultation Form Section */}
      <section className="bg-gray-950 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <ConsultationForm
            defaultService="basic-audit"
            title="Solicita tu Consulta de Seguridad"
            submitText="Solicitar Presupuesto"
          />
        </div>
      </section>
    </main>
  );
}
