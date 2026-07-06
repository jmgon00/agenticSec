"use client";

import { useState } from "react";
import { PortfolioItem } from "@/lib/types/portfolio";
import { Card } from "@/components/ui/Card";
import { AgenticIAProjectModal } from "./AgenticIAProjectModal";

interface AgenticIAPortfolioGridProps {
  projects: PortfolioItem[];
}

export const AgenticIAPortfolioGrid = ({
  projects,
}: AgenticIAPortfolioGridProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedProject = projects.find((p) => p.id === selectedId) || null;

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              className="cursor-pointer group"
            >
              <Card className="h-full overflow-hidden hover:border-cyan-400 transition-all transform hover:scale-105">
                <div className="relative h-48 bg-gray-800 overflow-hidden rounded-lg mb-4">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-900/20 to-gray-900">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold text-cyan-400 mb-2 uppercase">
                    {project.category.replace(/-/g, " ")}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-300 line-clamp-2 mb-4">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>

        <AgenticIAProjectModal
          project={selectedProject}
          onClose={() => setSelectedId(null)}
        />
      </div>
    </section>
  );
};
