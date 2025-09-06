"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Upload, BarChart3, TrendingUp, Shield, Zap, LogOut, User } from "lucide-react"
import { AuthModal } from "@/components/auth-modal"
import { FileUploadSection } from "@/components/file-upload-section"
import { SalaryDashboard } from "@/components/salary-dashboard"
import { UserDashboard } from "@/components/user-dashboard"
import { useAuth } from "@/hooks/use-auth"
import type { OfferType } from "@/types/offer"

export default function HomePage() {
  const [showAuth, setShowAuth] = useState(false)
  const [salaryData, setSalaryData] = useState<OfferType[]>([])   // 👈 single source of truth
  const [showDashboard, setShowDashboard] = useState(false)
  const [showUserDashboard, setShowUserDashboard] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      checkForSavedOffers()
    }
  }, [isAuthenticated, isLoading])

  const checkForSavedOffers = async () => {
    try {
      const response = await fetch("/api/offers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.offers && data.offers.length > 0) {
          setShowUserDashboard(true)
        }
      }
    } catch (error) {
      console.error("Failed to check saved offers:", error)
    }
  }

  const handleFilesProcessed = (files: OfferType[]) => {
     const safeArray = Array.isArray(files) ? files : [files] 
    setIsTransitioning(true)
    setTimeout(() => {
       setSalaryData(Array.isArray(files) ? files : [files]) // ✅ safe
      setSalaryData(files) // 👈 dataset set
      setShowDashboard(true)
      setShowUserDashboard(false)
      setIsTransitioning(false)
    }, 300)
  }

  const handleBackToUpload = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setShowDashboard(false)
      setShowUserDashboard(false)
      setSalaryData([]) // 👈 reset salary data
      setIsTransitioning(false)
    }, 200)
  }

  const handleViewDemo = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setShowDashboard(true)
      setShowUserDashboard(false)
      setIsTransitioning(false)
    }, 300)
  }

  const handleAuthenticated = (token: string, userData: any) => {
    login(token, userData)
    setShowAuth(false)
    setTimeout(() => {
      checkForSavedOffers()
    }, 500)
  }

  const handleLogout = async () => {
    await logout()
    setShowDashboard(false)
    setShowUserDashboard(false)
    setSalaryData([])
  }

  const handleShowUserDashboard = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setShowUserDashboard(true)
      setShowDashboard(false)
      setIsTransitioning(false)
    }, 200)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 group cursor-pointer"
            onClick={() => {
              setShowDashboard(false)
              setShowUserDashboard(false)
            }}
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:rotate-3">
              <img src="/logo.png" alt="SalaryScope Logo" width={32} height={32} />
            </div>
            <h1 className="text-xl font-serif font-bold text-foreground transition-colors duration-200 group-hover:text-accent">
              SalaryScope
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleShowUserDashboard}
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
                  disabled={isTransitioning}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleBackToUpload}
                  className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105"
                  disabled={isTransitioning}
                >
                  Upload More
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-105"
                  disabled={isTransitioning}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Button
                onClick={() => setShowAuth(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground transition-all duration-200 hover:scale-105 hover:shadow-lg"
                disabled={isTransitioning}
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Loading Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground animate-pulse">Loading...</p>
          </div>
        </div>
      )}

      {/* User Dashboard */}
      {isAuthenticated && showUserDashboard && !isTransitioning && (
        <section className="py-8 px-4 animate-in fade-in-0 slide-in-from-right-4 duration-700">
          <div className="container mx-auto max-w-7xl">
            <UserDashboard onUploadMore={handleBackToUpload} />
          </div>
        </section>
      )}

      {/* Upload Section for Authenticated Users */}
      {isAuthenticated && !showDashboard && !showUserDashboard && !isTransitioning && (
        <section className="py-16 px-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="container mx-auto max-w-4xl">
            <FileUploadSection onFilesProcessed={handleFilesProcessed} />
          </div>
        </section>
      )}

      {/* Dashboard */}
      {showDashboard && !isTransitioning && (
        <section className="py-8 px-4 animate-in fade-in-0 slide-in-from-right-4 duration-700">
          <div className="container mx-auto max-w-7xl">
            {(() => {
              console.log("Processed Files Data:", salaryData)
              return null
            })()}
            <SalaryDashboard processedFiles={salaryData} onBackToUpload={handleBackToUpload} />
          </div>
        </section>
      )}

      {/* Hero Section - only show when not authenticated or no files processed */}
      {(!isAuthenticated || (!showDashboard && salaryData.length === 0)) && !isTransitioning && (
        <>
          {/* Hero Section */}
          {/* {salaryData.length > 0 && ( */}
            <section className="py-20 px-4 animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
              <div className="container mx-auto max-w-4xl text-center">
                <Badge
                  variant="secondary"
                  className="mb-6 bg-accent/10 text-accent border-accent/20 animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-100 hover:scale-105 transition-transform cursor-default"
                >
                  Transform Your Career Decisions
                </Badge>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
                  Turn Offer Letters into
                  <span className="text-accent block bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent animate-in slide-in-from-left-4 duration-700 delay-400">
                    Clear Salary Insights
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-500">
                  Upload your offer letter and get detailed CTC breakdowns, tax calculations, and side-by-side comparisons
                  to make informed career decisions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-700">
                  <Button
                    size="lg"
                    onClick={() => setShowAuth(true)}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                    disabled={isTransitioning}
                  >
                    Analyze Your Offer
                    <Upload className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:scale-110" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleViewDemo}
                    className="border-border hover:bg-muted px-8 py-3 text-lg bg-transparent transition-all duration-300 hover:scale-105 hover:shadow-lg group"
                    disabled={isTransitioning}
                  >
                    View Demo
                    <TrendingUp className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </section>
          {/* )} */}

          {/* Features Section */}
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto max-w-6xl">
              <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
                  Everything You Need to Understand Your Offer
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get comprehensive insights that go beyond the basic salary number
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-border bg-card hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110">
                      <BarChart3 className="w-6 h-6 text-accent transition-transform duration-300 group-hover:rotate-12" />
                    </div>
                    <CardTitle className="font-serif transition-colors duration-200 group-hover:text-accent">
                      Detailed CTC Breakdown
                    </CardTitle>
                    <CardDescription className="transition-colors duration-200 group-hover:text-foreground">
                      See exactly how your salary is structured - base pay, bonuses, benefits, and more
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border bg-card hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 group animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex itemsCenter justifyCenter mb-4 transitionAll duration-300 groupHover:bg-accent/20 groupHover:scale-110">
                      <TrendingUp className="w-6 h-6 text-accent transitionTransform duration-300 groupHover:rotate-12" />
                    </div>
                    <CardTitle className="font-serif transitionColors duration-200 groupHover:text-accent">
                      Smart Comparisons
                    </CardTitle>
                    <CardDescription className="transitionColors duration-200 groupHover:text-foreground">
                      Compare multiple offers side-by-side with visual charts and key metrics
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="border-border bg-card hover:shadow-xl transitionAll duration-300 hover:scale-105 hover:-translate-y-2 group animateIn fadeIn-0 slideInFromBottom-4 duration-500 delay-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex itemsCenter justifyCenter mb-4 transitionAll duration-300 groupHover:bg-accent/20 groupHover:scale-110">
                      <Shield className="w-6 h-6 text-accent transitionTransform duration-300 groupHover:rotate-12" />
                    </div>
                    <CardTitle className="font-serif transitionColors duration-200 groupHover:text-accent">
                      Tax Calculations
                    </CardTitle>
                    <CardDescription className="transitionColors duration-200 groupHover:text-foreground">
                      Understand your take-home salary with accurate tax deductions and savings
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 px-4 bg-accent/5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="container mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-100">
                Ready to Decode Your Offer Letter?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-200">
                Join thousands of students making smarter career decisions with clear salary insights
              </p>
              <Button
                size="lg"
                onClick={() => setShowAuth(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg transition-all duration-300 hover:scale-110 hover:shadow-2xl group animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300"
                disabled={isTransitioning}
              >
                Start Analyzing Now
                <Zap className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:scale-125 group-hover:rotate-12" />
              </Button>
            </div>
          </section>
        </>
      )}

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 transition-all duration-300">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-default">
            © 2025 SalaryScope. Empowering students with salary transparency.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuth} onOpenChange={setShowAuth} onAuthenticated={handleAuthenticated} />
    </div>
  )
}
