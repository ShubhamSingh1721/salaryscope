import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateJWT, isOTPExpired } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Find OTP record
    const otpRecord = await db.collection("otps").findOne({ email, otp })

    if (!otpRecord) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.createdAt)) {
      await db.collection("otps").deleteOne({ _id: otpRecord._id })
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
    }

    // Update user as verified
    const user = await db.collection("users").findOneAndUpdate(
      { email },
      {
        $set: {
          isVerified: true,
          lastLogin: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate JWT token
    const token = generateJWT(user._id.toString(), email)

    // Clean up OTP
    await db.collection("otps").deleteOne({ _id: otpRecord._id })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
