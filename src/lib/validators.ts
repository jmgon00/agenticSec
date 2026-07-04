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
  serviceType: z.enum(
    ["vulnerability-analysis", "audit", "consulting", "ai-agents"],
    {
      errorMap: () => ({ message: "Tipo de servicio inválido" }),
    }
  ),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(5000, "El mensaje no puede exceder 5000 caracteres"),
  budgetRange: z
    .enum(["5k-10k", "10k-25k", "25k+", "otro"], {
      errorMap: () => ({ message: "Rango de presupuesto inválido" }),
    })
    .optional()
    .or(z.literal("")),
  honeypot: z
    .string()
    .optional()
    .or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
