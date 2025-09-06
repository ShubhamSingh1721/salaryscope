import nodemailer from "nodemailer"

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "SalaryScope - Your Verification Code",
      html: `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbeb;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background-color: #f97316; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">S</span>
            </div>
            <h1 style="color: #ea580c; margin: 0; font-size: 28px; font-weight: 700;">SalaryScope</h1>
          </div>
          
          <div style="background-color: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <h2 style="color: #4b5563; margin-top: 0; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Use this code to complete your authentication and access your salary analysis dashboard:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background-color: #fef2f2; padding: 20px 40px; border-radius: 8px; border: 2px dashed #f97316;">
                <span style="font-size: 32px; font-weight: 700; color: #ea580c; letter-spacing: 8px;">${otp}</span>
              </div>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-bottom: 0;">
              This code will expire in 5 minutes for your security.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>© 2024 SalaryScope. Empowering students with salary transparency.</p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Email sending failed:", error)
    return false
  }
}
