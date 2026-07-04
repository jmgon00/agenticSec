import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const successResponse = <T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> => {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
};

export const errorResponse = (
  error: string,
  status: number = 400
): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
};

export const validateApiKey = (key: string | null): boolean => {
  const expectedKey = process.env.API_KEY;
  if (!expectedKey) {
    console.error("API_KEY no está configurada");
    return false;
  }
  return key === expectedKey;
};

export const getClientIp = (request: Request): string => {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return ip;
};
