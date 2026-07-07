export interface AboutMe {
  bio: string;
  skills: string;
  yearsExperience: number;
  focusAreas: string[];
}

export interface Certification {
  title: string;
  issuer: string;
  year: number;
  credentialId?: string;
  credentialUrl?: string;
}

export const ABOUT_ME: AboutMe = {
  bio: "Soy analista de ciberseguridad especializado en auditorías de seguridad, análisis de vulnerabilidades y automatización con agentes de IA. Con más de X años de experiencia ayudando a empresas de todos los tamaños a proteger sus sistemas y datos contra amenazas emergentes. Mi enfoque combina análisis técnico riguroso con consultoría estratégica.",
  skills: "Mi expertise técnico abarca análisis dinámico y estático de aplicaciones, pruebas de penetración en infraestructuras, configuración segura de servidores, y desarrollo de agentes autónomos para automatización de tareas repetitivas. Trabajo con tecnologías modernas de seguridad, metodologías OWASP, estándares de compliance como ISO 27001, y frameworks de automatización con IA.",
  yearsExperience: 7,
  focusAreas: [
    "Análisis de Vulnerabilidades",
    "Auditorías de Seguridad",
    "Penetration Testing",
    "Automatización con IA",
    "Cumplimiento Normativo (Compliance)",
  ],
};

export const CERTIFICATIONS: Certification[] = [
  {
    title: "Certified Ethical Hacker (CEH)",
    issuer: "EC-Council",
    year: 2022,
    credentialId: "ECC1234567",
  },
  {
    title: "OSCP - Offensive Security Certified Professional",
    issuer: "Offensive Security",
    year: 2023,
  },
  {
    title: "AWS Certified Security - Specialty",
    issuer: "Amazon Web Services",
    year: 2023,
  },
];
