import { NextRequest } from "next/server";
import { consultationFormSchema } from "@/lib/validators";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, getClientIp } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Obtener IP del cliente
    const clientIp = getClientIp(request);

    // Verificar rate limiting
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
      return errorResponse("Has excedido el límite de solicitudes. Intenta más tarde.", 429);
    }

    // Parsear body
    const body = await request.json();

    // Validar con Zod
    const parsed = consultationFormSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Datos inválidos: " + JSON.stringify(parsed.error.issues), 400);
    }

    // Guardar en BD
    const consultation = await prisma.consultation.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.company,
        companySize: parsed.data.companySize,
        serviceInterest: parsed.data.serviceInterest,
        message: parsed.data.message,
        status: "pending",
      },
    });

    // Log para debugging (TODO: enviar notificación por email)
    console.log("[POST /api/consultation] Nueva consulta creada:", {
      id: consultation.id,
      email: consultation.email,
      name: consultation.name,
      serviceInterest: consultation.serviceInterest,
    });

    return successResponse(
      { id: consultation.id },
      "Consulta recibida. Te contactaremos pronto.",
      201
    );
  } catch (error) {
    console.error("[POST /api/consultation] Error:", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
