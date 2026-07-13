import { z } from "zod";

export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email no puede exceder 255 caracteres"),
  company: z
    .string()
    .max(100, "Empresa no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),
  serviceType: z.enum(["vulnerability-analysis", "audit", "consulting", "ai-agents"]),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(5000, "El mensaje no puede exceder 5000 caracteres"),
  budgetRange: z
    .enum(["5k-10k", "10k-25k", "25k+", "otro"])
    .optional()
    .or(z.literal("")),
  honeypot: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const consultationFormSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .max(255, "Email no puede exceder 255 caracteres"),
  phone: z
    .string()
    .min(8, "El teléfono debe tener al menos 8 caracteres")
    .max(20, "El teléfono no puede exceder 20 caracteres"),
  company: z
    .string()
    .min(2, "El nombre de la empresa debe tener al menos 2 caracteres")
    .max(100, "El nombre de la empresa no puede exceder 100 caracteres"),
  companySize: z.enum(["startup", "pyme", "enterprise", "other"]),
  serviceInterest: z.enum(["basic-audit", "web-analysis", "infrastructure", "compliance", "ia-inquiry", "other"]),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(5000, "El mensaje no puede exceder 5000 caracteres"),
});

export type ConsultationFormData = z.infer<typeof consultationFormSchema>;
