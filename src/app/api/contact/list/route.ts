import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { successResponse, errorResponse, validateApiKey } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    // Extraer API_KEY del header Authorization
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    // Validar API_KEY
    if (!apiKey || !validateApiKey(apiKey)) {
      return errorResponse("API_KEY inválida o no proporcionada", 401);
    }

    // Obtener leads
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });

    return successResponse(
      {
        total: contacts.length,
        contacts,
      },
      "Leads obtenidos exitosamente"
    );
  } catch (error) {
    console.error("[GET /api/contact/list] Error:", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
