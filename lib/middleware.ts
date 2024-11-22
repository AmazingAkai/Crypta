import { type NextRequest, NextResponse } from "next/server";

export const corsMiddleware = (
  handler: (request: NextRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const responseHeaders = {
      "Access-Control-Allow-Origin": process.env.NEXT_ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { headers: responseHeaders });
    }

    const response = await handler(request);
    Object.entries(responseHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
};
