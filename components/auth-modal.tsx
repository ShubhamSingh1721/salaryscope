// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent } from "@/components/ui/card"
// import { Mail, Shield, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

// interface AuthModalProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
//   onAuthenticated: (token: string, user: any) => void
// }

// export function AuthModal({ open, onOpenChange, onAuthenticated }: AuthModalProps) {
//   const [step, setStep] = useState<"email" | "otp">("email")
//   const [email, setEmail] = useState("")
//   const [otp, setOtp] = useState(["", "", "", "", "", ""])
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSuccess, setIsSuccess] = useState(false)
//   const [error, setError] = useState("")

//   const handleSendOTP = async () => {
//     if (!email) return
//     setIsLoading(true)
//     setError("")

//     try {
//       const response = await fetch("/api/auth/send-otp", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email }),
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to send OTP")
//       }

//       setStep("otp")
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to send OTP")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleOTPChange = (index: number, value: string) => {
//     if (value.length > 1) return
//     const newOtp = [...otp]
//     newOtp[index] = value
//     setOtp(newOtp)

//     // Auto-focus next input
//     if (value && index < 5) {
//       const nextInput = document.getElementById(`otp-${index + 1}`)
//       nextInput?.focus()
//     }
//   }

//   const handleVerifyOTP = async () => {
//     const otpString = otp.join("")
//     if (otpString.length !== 6) return

//     setIsLoading(true)
//     setError("")

//     try {
//       const response = await fetch("/api/auth/verify-otp", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email, otp: otpString }),
//       })

//       const data = await response.json()

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to verify OTP")
//       }

//       setIsSuccess(true)

//       // Store token in localStorage
//       localStorage.setItem("auth-token", data.token)
//       localStorage.setItem("user", JSON.stringify(data.user))

//       setTimeout(() => {
//         onAuthenticated(data.token, data.user)
//         setIsSuccess(false)
//         setStep("email")
//         setOtp(["", "", "", "", "", ""])
//         setEmail("")
//         setError("")
//       }, 1500)
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to verify OTP")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       const prevInput = document.getElementById(`otp-${index - 1}`)
//       prevInput?.focus()
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-md transition-all duration-300">
//         <DialogHeader>
//           <DialogTitle className="font-serif text-center transition-all duration-200">
//             {isSuccess ? "Welcome!" : step === "email" ? "Get Started" : "Verify Your Email"}
//           </DialogTitle>
//           <DialogDescription className="text-center transition-all duration-200">
//             {isSuccess
//               ? "Authentication successful! Redirecting to your dashboard..."
//               : step === "email"
//                 ? "Enter your email to access your salary analysis dashboard"
//                 : `We've sent a 6-digit code to ${email}`}
//           </DialogDescription>
//         </DialogHeader>

//         {error && (
//           <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-in fade-in-0 slide-in-from-top-2 duration-300">
//             <AlertCircle className="w-4 h-4 flex-shrink-0" />
//             <span>{error}</span>
//           </div>
//         )}

//         {isSuccess ? (
//           <Card className="border-0 shadow-none">
//             <CardContent className="pt-6 text-center">
//               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-0 duration-500">
//                 <CheckCircle className="w-8 h-8 text-green-600 animate-in zoom-in-0 duration-300 delay-200" />
//               </div>
//               <p className="text-green-600 font-medium animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
//                 Authentication Successful!
//               </p>
//             </CardContent>
//           </Card>
//         ) : step === "email" ? (
//           <Card className="border-0 shadow-none">
//             <CardContent className="space-y-4 pt-6">
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email Address</Label>
//                 <div className="relative group">
//                   <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-accent" />
//                   <Input
//                     id="email"
//                     type="email"
//                     placeholder="student@university.edu"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-accent/20 focus:border-accent"
//                     onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
//                   />
//                 </div>
//               </div>
//               <Button
//                 onClick={handleSendOTP}
//                 disabled={!email || isLoading}
//                 className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-105 disabled:hover:scale-100 group"
//               >
//                 {isLoading ? (
//                   <div className="flex items-center">
//                     <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
//                     Sending...
//                   </div>
//                 ) : (
//                   <>
//                     Send Verification Code
//                     <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
//                   </>
//                 )}
//               </Button>
//               <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
//                 <Shield className="w-4 h-4" />
//                 <span>Your data is secure and private</span>
//               </div>
//             </CardContent>
//           </Card>
//         ) : (
//           <Card className="border-0 shadow-none">
//             <CardContent className="space-y-4 pt-6">
//               <div className="space-y-2">
//                 <Label>Enter 6-digit code</Label>
//                 <div className="flex space-x-2 justify-center">
//                   {otp.map((digit, index) => (
//                     <Input
//                       key={index}
//                       id={`otp-${index}`}
//                       type="text"
//                       inputMode="numeric"
//                       maxLength={1}
//                       value={digit}
//                       onChange={(e) => handleOTPChange(index, e.target.value)}
//                       onKeyDown={(e) => handleKeyDown(index, e)}
//                       className="w-12 h-12 text-center text-lg font-semibold transition-all duration-200 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:scale-110"
//                     />
//                   ))}
//                 </div>
//               </div>
//               <Button
//                 onClick={handleVerifyOTP}
//                 disabled={otp.join("").length !== 6 || isLoading}
//                 className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
//               >
//                 {isLoading ? (
//                   <div className="flex items-center">
//                     <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
//                     Verifying...
//                   </div>
//                 ) : (
//                   "Verify & Continue"
//                 )}
//               </Button>
//               <Button
//                 variant="ghost"
//                 onClick={() => {
//                   setStep("email")
//                   setError("")
//                   setOtp(["", "", "", "", "", ""])
//                 }}
//                 className="w-full transition-all duration-200 hover:scale-105"
//               >
//                 Change Email Address
//               </Button>
//             </CardContent>
//           </Card>
//         )}
//       </DialogContent>
//     </Dialog>
//   )
// }









"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Shield, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthenticated: (token: string, user: any) => void
}

export function AuthModal({ open, onOpenChange, onAuthenticated }: AuthModalProps) {
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Focus first OTP input when OTP step is active
  useEffect(() => {
    if (step === "otp" && otpRefs.current[0]) {
      otpRefs.current[0].focus()
    }
  }, [step])

  const handleSendOTP = async () => {
    if (!email) return
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      setStep("otp")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpString = otp.join("")
    if (otpString.length !== 6) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpString }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP")
      }

      setIsSuccess(true)

      // Store token in localStorage
      localStorage.setItem("auth-token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      setTimeout(() => {
        onAuthenticated(data.token, data.user)
        setIsSuccess(false)
        setStep("email")
        setOtp(["", "", "", "", "", ""])
        setEmail("")
        setError("")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }

    // Pressing Enter on last box should verify
    if (e.key === "Enter") {
      if (index === 5) {
        handleVerifyOTP()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md transition-all duration-300">
        <DialogHeader>
          <DialogTitle className="font-serif text-center transition-all duration-200">
            {isSuccess ? "Welcome!" : step === "email" ? "Get Started" : "Verify Your Email"}
          </DialogTitle>
          <DialogDescription className="text-center transition-all duration-200">
            {isSuccess
              ? "Authentication successful! Redirecting to your dashboard..."
              : step === "email"
                ? "Enter your email to access your salary analysis dashboard"
                : `We've sent a 6-digit code to ${email}`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm animate-in fade-in-0 slide-in-from-top-2 duration-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <Card className="border-0 shadow-none">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-0 duration-500">
                <CheckCircle className="w-8 h-8 text-green-600 animate-in zoom-in-0 duration-300 delay-200" />
              </div>
              <p className="text-green-600 font-medium animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-400">
                Authentication Successful!
              </p>
            </CardContent>
          </Card>
        ) : step === "email" ? (
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-accent" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  />
                </div>
              </div>
              <Button
                onClick={handleSendOTP}
                disabled={!email || isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-105 disabled:hover:scale-100 group"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Your data is secure and private</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-none">
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label>Enter 6-digit code</Label>
                <div className="flex space-x-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                     ref={(el) => { otpRefs.current[index] = el }}


                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold transition-all duration-200 focus:ring-2 focus:ring-accent/20 focus:border-accent focus:scale-110"
                    />
                  ))}
                </div>
              </div>
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.join("").length !== 6 || isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("email")
                  setError("")
                  setOtp(["", "", "", "", "", ""])
                }}
                className="w-full transition-all duration-200 hover:scale-105"
              >
                Change Email Address
              </Button>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}
