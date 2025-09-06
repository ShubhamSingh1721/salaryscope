import jwt from "jsonwebtoken"
import crypto from "crypto"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export function generateJWT(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyJWT(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string }
    return decoded
  } catch (error) {
    return null
  }
}

export function isOTPExpired(createdAt: Date): boolean {
  const now = new Date()
  const expiryTime = new Date(createdAt.getTime() + 5 * 60 * 1000) // 5 minutes
  return now > expiryTime
}
