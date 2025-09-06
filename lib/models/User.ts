export interface User {
  _id?: string
  email: string
  isVerified: boolean
  createdAt: Date
  lastLogin?: Date
}

export interface OTPRecord {
  _id?: string
  email: string
  otp: string
  expiresAt: Date
  createdAt: Date
}

export const UserSchema = {
  email: { type: "string", required: true, unique: true },
  isVerified: { type: "boolean", default: false },
  createdAt: { type: "date", default: () => new Date() },
  lastLogin: { type: "date", optional: true },
}

export const OTPSchema = {
  email: { type: "string", required: true },
  otp: { type: "string", required: true },
  expiresAt: { type: "date", required: true },
  createdAt: { type: "date", default: () => new Date() },
}
