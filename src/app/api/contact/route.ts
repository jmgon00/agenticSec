import { NextRequest } from "next/server";
import { contactFormSchema } from "@/lib/validators";
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

    // Verificar honeypot (campo anti-spam)
    if (body.honeypot && body.honeypot.trim() !== "") {
      // No revelar que es spam, simular éxito
      return successResponse({ id: "filtered" }, "Tu solicitud ha sido recibida");
    }

    // Validar con Zod
    const parsed = contactFormSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Datos inválidos: " + JSON.stringify(parsed.error.errors), 400);
    }

    // Guardar en BD
    const contact = await prisma.contact.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || null,
        serviceType: parsed.data.serviceType,
        message: parsed.data.message,
        budgetRange: parsed.data.budgetRange || null,
        status: "new",
      },
    });

    return successResponse(
      { id: contact.id },
      "Solicitud recibida. Te contactaremos pronto.",
      201
    );
  } catch (error) {
    console.error("[POST /api/contact] Error:", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
