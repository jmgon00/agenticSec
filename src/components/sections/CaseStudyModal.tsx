"use client";

import { CaseStudy } from "@/content/portfolio";
import { Modal } from "@/components/ui/Modal";

interface CaseStudyModalProps {
  caseStudy: CaseStudy | null;
  onClose: () => void;
}

export const CaseStudyModal = ({ caseStudy, onClose }: CaseStudyModalProps) => {
  if (!caseStudy) return null;

  return (
    <Modal isOpen={!!caseStudy} onClose={onClose} title={caseStudy.title}>
      <div className="space-y-6">
        {caseStudy.image && (
          <img
            src={caseStudy.image}
            alt={caseStudy.title}
            className="w-full rounded-lg max-h-64 object-cover"
          />
        )}

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Problema</h3>
          <p className="text-gray-300">{caseStudy.problem}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Solución</h3>
          <p className="text-gray-300">{caseStudy.solution}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Resultados</h3>
          <p className="text-gray-300">{caseStudy.results}</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-400 mb-2">Tecnologías</h3>
          <div className="flex flex-wrap gap-2">
            {caseStudy.technologies.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {caseStudy.video && (
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Video</h3>
            <a
              href={caseStudy.video}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Ver video →
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};
