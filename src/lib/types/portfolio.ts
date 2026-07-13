export interface PortfolioItemContent {
  shortDescription?: string;
  longDescription?: string;
  techStack?: string[];
  workflow?: string;
  results?: string[];
  benchmarks?: Record<string, string>;
  repositoryUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  documentation?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: "agentic-ia" | "security-case";
  description: string;
  thumbnail?: string;
  tags: string[];
  featured?: boolean;
  content: PortfolioItemContent;
}

export interface SecurityService {
  id: string;
  name: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  whatIncludes: string[];
  forWho: string;
  price?: string | null;
}

export interface ConsultationFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  companySize: "startup" | "pyme" | "enterprise" | "other";
  serviceInterest: "basic-audit" | "web-analysis" | "infrastructure" | "compliance" | "ia-inquiry" | "other";
  message: string;
}
