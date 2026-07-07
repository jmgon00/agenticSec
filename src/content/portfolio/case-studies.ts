export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  objective: string;
  challenge: string;
  solution: string;
  result: string;
  technologies: string[];
  client?: string;
  duration?: string;
  role?: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "case-1",
    title: "Por definir - Caso 1",
    description: "Espacio reservado para primer caso de estudio",
    imageUrl: "/images/case-studies/placeholder-1.jpg",
    objective: "Objetivo del proyecto",
    challenge: "Desafío técnico a resolver",
    solution: "Solución implementada",
    result: "Resultado y métricas de éxito",
    technologies: ["Tech1", "Tech2"],
    client: "Nombre del cliente",
    duration: "3 meses",
    role: "Rol en el proyecto",
  },
  {
    id: "case-2",
    title: "Por definir - Caso 2",
    description: "Espacio reservado para segundo caso de estudio",
    imageUrl: "/images/case-studies/placeholder-2.jpg",
    objective: "Objetivo del proyecto",
    challenge: "Desafío técnico a resolver",
    solution: "Solución implementada",
    result: "Resultado y métricas de éxito",
    technologies: ["Tech1", "Tech2"],
    client: "Nombre del cliente",
    duration: "2 meses",
    role: "Rol en el proyecto",
  },
  {
    id: "case-3",
    title: "Por definir - Caso 3",
    description: "Espacio reservado para tercer caso de estudio",
    imageUrl: "/images/case-studies/placeholder-3.jpg",
    objective: "Objetivo del proyecto",
    challenge: "Desafío técnico a resolver",
    solution: "Solución implementada",
    result: "Resultado y métricas de éxito",
    technologies: ["Tech1", "Tech2"],
    client: "Nombre del cliente",
    duration: "4 meses",
    role: "Rol en el proyecto",
  },
];
