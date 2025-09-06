// import { type NextRequest, NextResponse } from "next/server"
// import { connectToDatabase } from "@/lib/mongodb"
// import { generateOTP } from "@/lib/auth"
// import { sendOTPEmail } from "@/lib/email"
// import type { User, OTPRecord } from "@/lib/models/User"

// export async function POST(request: NextRequest) {
//   try {
//     const { email } = await request.json()

//     if (!email || !email.includes("@")) {
//       return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
//     }

//     const { db } = await connectToDatabase()

//     // Generate OTP
//     const otp = generateOTP()
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

//     // Store OTP in database
//     await db.collection("otps").deleteMany({ email }) // Remove existing OTPs
//     await db.collection("otps").insertOne({
//       email,
//       otp,
//       expiresAt,
//       createdAt: new Date(),
//     } as OTPRecord)

//     // Send OTP via email
//     const emailSent = await sendOTPEmail(email, otp)

//     if (!emailSent) {
//       return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
//     }

//     // Check if user exists, if not create one
//     const existingUser = await db.collection("users").findOne({ email })
//     if (!existingUser) {
//       await db.collection("users").insertOne({
//         email,
//         isVerified: false,
//         createdAt: new Date(),
//       } as User)
//     }

//     return NextResponse.json({
//       success: true,
//       message: "OTP sent successfully",
//     })
//   } catch (error) {
//     console.error("Send OTP error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }









// import { type NextRequest, NextResponse } from "next/server"
// import { connectToDatabase } from "@/lib/mongodb"
// import { generateOTP } from "@/lib/auth"
// import nodemailer from "nodemailer"
// import { ObjectId } from "mongodb"

// // OTPRecord and User interfaces
// interface OTPRecord {
//   _id?: ObjectId
//   email: string
//   otp: string
//   expiresAt: Date
//   createdAt: Date
// }

// interface User {
//   _id?: ObjectId
//   email: string
//   isVerified: boolean
//   createdAt: Date
// }

// // Function to send OTP email
// async function sendOTPEmail(to: string, otp: string) {
// console.log("EMAIL_PASSWORD length:", process.env.EMAIL_PASSWORD?.length)

//   console.log("EMAIL env:", process.env.EMAIL)
// console.log("EMAIL_PASSWORD env:", process.env.EMAIL_PASSWORD)

//   if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
//     console.error("EMAIL or EMAIL_PASSWORD is not set in .env.local")
//     return false
//   }

//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.EMAIL_PASSWORD, // Gmail App Password
//     },
//   })

//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL,
//       to,
//       subject: "Your OTP Code",
//       text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
//     })
//     return true
//   } catch (error) {
//     console.error("Email sending failed:", error)
//     return false
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const { email } = await request.json()

//     if (!email || !email.includes("@")) {
//       return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
//     }

//     const { db } = await connectToDatabase()

//     // Generate OTP
//     const otp = generateOTP()
//     const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

//     // Store OTP in database
//     await db.collection<OTPRecord>("otps").deleteMany({ email })
//     await db.collection<OTPRecord>("otps").insertOne({
//       email,
//       otp,
//       expiresAt,
//       createdAt: new Date(),
//     })

//     // Send OTP via email
//     const emailSent = await sendOTPEmail(email, otp)

//     if (!emailSent) {
//       return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
//     }

//     // Check if user exists, if not create one
//     const existingUser = await db.collection<User>("users").findOne({ email })
//     if (!existingUser) {
//       await db.collection<User>("users").insertOne({
//         email,
//         isVerified: false,
//         createdAt: new Date(),
//       })
//     }

//     return NextResponse.json({
//       success: true,
//       message: "OTP sent successfully",
//     })
//   } catch (error) {
//     console.error("Send OTP error:", error)
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
//   }
// }







import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { generateOTP } from "@/lib/auth"
import nodemailer from "nodemailer"
import { ObjectId } from "mongodb"

// OTP record interface
interface OTPRecord {
  _id?: ObjectId
  email: string
  otp: string
  expiresAt: Date
  createdAt: Date
}

// User interface
interface User {
  _id?: ObjectId
  email: string
  isVerified: boolean
  createdAt: Date
}

// Function to send professional OTP email
async function sendOTPEmail(to: string, otp: string) {
  if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
    console.error("EMAIL or EMAIL_PASSWORD is not set in .env.local")
    return false
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD, // Gmail App Password
    },
  })

  try {
    await transporter.sendMail({
      from: `"SalaryScope" <noreply@salaryscope.com>`, // Professional sender
      to,
      subject: "Your SalaryScope OTP Code",
      text: `Hello!\n\nYour OTP for SalaryScope is: ${otp}\nIt will expire in 5 minutes.\n\nThank you,\nSalaryScope Team`,
      html: `
        <p>Hello,</p>
        <p>Your OTP for <strong>SalaryScope</strong> is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 5 minutes.</p>
        <p>Thank you,<br/><strong>SalaryScope Team</strong></p>
      `,
    })
    return true
  } catch (error) {
    console.error("Email sending failed:", error)
    return false
  }
}

// POST handler to generate and send OTP
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Generate OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store OTP in database
    await db.collection<OTPRecord>("otps").deleteMany({ email })
    await db.collection<OTPRecord>("otps").insertOne({
      email,
      otp,
      expiresAt,
      createdAt: new Date(),
    })

    // Send OTP via professional email
    const emailSent = await sendOTPEmail(email, otp)
    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
    }

    // Check if user exists, if not create one
    const existingUser = await db.collection<User>("users").findOne({ email })
    if (!existingUser) {
      await db.collection<User>("users").insertOne({
        email,
        isVerified: false,
        createdAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully via SalaryScope",
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
