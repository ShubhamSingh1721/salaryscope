import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const decoded = verifyJWT(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Verify user still exists and is verified
    const user = await db.collection("users").findOne({
      // _id: decoded.userId,
      email: decoded.email,
      isVerified: true,
    })

    if (!user) {
      return NextResponse.json({ error: "User not found or not verified" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Token verification failed" }, { status: 500 })
  }
}
