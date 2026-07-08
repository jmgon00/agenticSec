import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category") // "educativo" | "productivo" | "all"
    const search = searchParams.get("search") // optional substring search

    let where: Record<string, unknown> = {}

    // Filter by category
    if (category && category !== "all") {
      if (!["educativo", "productivo"].includes(category)) {
        return NextResponse.json(
          { success: false, error: "Invalid category" },
          { status: 400 }
        )
      }
      where.category = category
    }

    // Search by name/description
    if (search) {
      const searchCondition = {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }

      // If category is already set, combine with AND
      if (Object.keys(where).length > 0) {
        where = {
          AND: [where, searchCondition],
        }
      } else {
        where = searchCondition
      }
    }

    const agents = await prisma.agent.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        type: true,
        icon: true,
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      success: true,
      data: agents,
    })
  } catch (error) {
    console.error("[GET /api/agents]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}
