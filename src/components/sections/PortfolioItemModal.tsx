import { PortfolioItem } from "@/lib/types/portfolio";
import { Button } from "@/components/ui/Button";

interface PortfolioItemModalProps {
  item: PortfolioItem;
  isOpen: boolean;
  onClose: () => void;
}

export const PortfolioItemModal = ({
  item,
  isOpen,
  onClose,
}: PortfolioItemModalProps) => {
  if (!isOpen) return null;

  const handleBackdropClick = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex justify-between items-start">
          <h2 className="text-2xl font-bold text-white">{item.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Short Description */}
          {item.content.shortDescription && (
            <div>
              <h3 className="text-cyan-400 font-bold mb-3">Descripción Corta</h3>
              <p className="text-gray-300">{item.content.shortDescription}</p>
            </div>
          )}

          {/* Long Description */}
          {item.content.longDescription && (
            <div>
              <h3 className="text-cyan-400 font-bold mb-3">Descripción Completa</h3>
              <p className="text-gray-300">{item.content.longDescription}</p>
            </div>
          )}

          {/* Tech Stack */}
          {item.content.techStack && item.content.techStack.length > 0 && (
            <div>
              <h3 className="text-cyan-400 font-bold mb-3">Stack Tecnológico</h3>
              <div className="flex flex-wrap gap-2">
                {item.content.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-cyan-900/30 border border-cyan-500 rounded-full text-sm text-cyan-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Workflow */}
          {item.content.workflow && (
            <div>
              <h3 className="text-cyan-400 font-bold mb-3">Flujo</h3>
              <p className="text-gray-300">{item.content.workflow}</p>
            </div>
          )}

          {/* Results */}
          {item.content.results && item.content.results.length > 0 && (
            <div>
              <h3 className="text-cyan-400 font-bold mb-3">Resultados</h3>
              <ul className="space-y-2">
                {item.content.results.map((result, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-gray-300"
                  >
                    <span className="text-green-400 font-bold mt-1">✓</span>
                    <span>{result}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benchmarks */}
          {item.content.benchmarks && Object.keys(item.content.benchmarks).length > 0 && (
            <div>
              <h3 className="text-cyan-400 font-bold mb-3">Benchmarks</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(item.content.benchmarks).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-gray-800 rounded p-4 border border-gray-700"
                  >
                    <div className="text-sm text-gray-400 mb-2">{key}</div>
                    <div className="text-lg font-bold text-cyan-400">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links Section */}
          {(item.content.repositoryUrl || item.content.demoUrl || item.content.videoUrl) && (
            <div className="pt-6 border-t border-gray-700">
              <div className="flex flex-wrap gap-3">
                {item.content.repositoryUrl && (
                  <a
                    href={item.content.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="secondary" size="sm">
                      Ver Repositorio
                    </Button>
                  </a>
                )}
                {item.content.demoUrl && (
                  <a
                    href={item.content.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="secondary" size="sm">
                      Demo en Vivo
                    </Button>
                  </a>
                )}
                {item.content.videoUrl && (
                  <a
                    href={item.content.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button variant="secondary" size="sm">
                      Ver Video
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
