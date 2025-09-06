import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string
    email: string
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest) => {
    try {
      const authHeader = req.headers.get("authorization")

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
      }

      const token = authHeader.substring(7) // Remove "Bearer " prefix
      const decoded = verifyJWT(token)

      if (!decoded) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }

      req.user = decoded
      return handler(req)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }
  }
}
