"use client";

import { PortfolioItem } from "@/lib/types/portfolio";

interface AgenticIAProjectModalProps {
  project: PortfolioItem | null;
  onClose: () => void;
}

export const AgenticIAProjectModal = ({
  project,
  onClose,
}: AgenticIAProjectModalProps) => {
  if (!project) return null;

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur border-b border-gray-800 p-6 flex justify-between items-start">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase mb-2">
              {project.category.replace(/-/g, " ")}
            </div>
            <h2 className="text-3xl font-bold text-white">{project.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          {project.thumbnail && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-800">
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Descripción</h3>
            <p className="text-gray-300">{project.description}</p>
          </div>

          {/* Long Description */}
          {project.content.longDescription && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Detalles</h3>
              <p className="text-gray-300">{project.content.longDescription}</p>
            </div>
          )}

          {/* Tech Stack */}
          {project.content.techStack && project.content.techStack.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Stack Tecnológico</h3>
              <div className="flex flex-wrap gap-2">
                {project.content.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="bg-cyan-900/40 text-cyan-300 px-3 py-1 rounded-full text-sm border border-cyan-700/50"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workflow */}
          {project.content.workflow && (
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Flujo de Trabajo</h3>
              <p className="text-gray-300">{project.content.workflow}</p>
            </div>
          )}

          {/* Results */}
          {project.content.results && project.content.results.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Resultados</h3>
              <ul className="space-y-2">
                {project.content.results.map((result, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <span className="text-cyan-400 font-bold mt-1">✓</span>
                    <span>{result}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm border border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-4 pt-4">
            {project.content.repositoryUrl && (
              <a
                href={project.content.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cyan-400 text-dark-base hover:shadow-glow-cyan hover:shadow-cyan-lg font-semibold rounded-lg transition-all duration-300 ease-out flex items-center justify-center gap-2 hover:scale-105 active:scale-95 px-6 py-3 text-base"
              >
                Ver Repositorio
              </a>
            )}
            {project.content.demoUrl && (
              <a
                href={project.content.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-magenta-400 text-white hover:shadow-glow-magenta font-semibold rounded-lg transition-all duration-300 ease-out flex items-center justify-center gap-2 hover:scale-105 active:scale-95 px-6 py-3 text-base"
              >
                Ver Demo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
