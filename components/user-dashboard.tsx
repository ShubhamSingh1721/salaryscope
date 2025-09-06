"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  Building2,
  TrendingUp,
  PiggyBank,
  Calendar,
  FileText,
  Trash2,
  Edit,
  Eye,
  Plus,
  History,
  BarChart3,
  Sparkles,
  Award,
  AlertCircle,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { useAuth } from "@/hooks/use-auth"

interface SavedOffer {
  _id: string
  company: string
  position?: string
  ctc: number
  base: number
  bonus?: number
  pf?: number
  medical?: number
  hra?: number
  lta?: number
  specialAllowance?: number
  inHandEst: number
  confidence?: number
  extractionMethod?: string
  warnings?: string[]
  uploadDate: string
  fileName?: string
  fileType?: string
}

interface UserStats {
  totalOffers: number
  averageCTC: number
  highestCTC: number
  lowestCTC: number
  averageInHand: number
  topCompanies: Array<{ company: string; count: number }>
  recentUploads: number
}

interface UserDashboardProps {
  onUploadMore?: () => void
}

interface OfferInsights {
  takeHomePercentage: number
  bonusPercentage: number
  pfPercentage: number
  variablePercentage: number
  fixedPercentage: number
  warnings: string[]
  recommendations: string[]
}

interface ComparisonData {
  offer1: SavedOffer
  offer2: SavedOffer
  insights1: OfferInsights
  insights2: OfferInsights
}

export function UserDashboard({ onUploadMore }: UserDashboardProps) {
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null)
  const [comparisonOffers, setComparisonOffers] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  // const { getAuthHeaders } = useAuth()

  useEffect(() => {
    fetchUserData()
  }, [])

// ✅ Safe helper function
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem("token");

  // Agar token hai tab hi return karo Authorization
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  return {}; // nahi hai to khali headers
};


// ✅ Fetch user data (offers + stats)
const fetchUserData = async () => {
  try {
    setIsLoading(true)
    setError(null)

    // 🔹 Fetch saved offers
    const offersResponse = await fetch("/api/offers", {
      headers: getAuthHeaders(),
    })

    if (!offersResponse.ok) {
      throw new Error("Failed to fetch offers")
    }

    const offersData = await offersResponse.json()
    setSavedOffers(offersData.offers || [])

    // 🔹 Fetch statistics
    const statsResponse = await fetch("/api/offers/stats", {
      headers: getAuthHeaders(),
    })

    if (!statsResponse.ok) {
      throw new Error("Failed to fetch statistics")
    }

    const statsData = await statsResponse.json()
    setUserStats(statsData.stats)

    // 🔹 Auto-select first offer
    if (offersData.offers?.length > 0) {
      setSelectedOffer(offersData.offers[0]._id)
    } else {
      setSelectedOffer(null)
    }
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to load data")
  } finally {
    setIsLoading(false)
  }
}

// ✅ Delete offer
const deleteOffer = async (offerId: string) => {
  try {
    const response = await fetch(`/api/offers/${offerId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete offer")
    }

    // 🔹 Remove from state
    setSavedOffers((prev) => {
      const updated = prev.filter((offer) => offer._id !== offerId)

      // update selected offer if needed
      if (selectedOffer === offerId) {
        setSelectedOffer(updated.length > 0 ? updated[0]._id : null)
      }

      return updated
    })

    // 🔹 Refresh stats after deletion
    await fetchUserData()
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to delete offer")
  }
}


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatLakhs = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null

    if (confidence >= 80) {
      return <Badge className="bg-green-100 text-green-700 text-xs">High Confidence</Badge>
    } else if (confidence >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-700 text-xs">Medium Confidence</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-700 text-xs">Low Confidence</Badge>
    }
  }

  const prepareOfferTrendData = () => {
    return savedOffers
      .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())
      .map((offer, index) => ({
        index: index + 1,
        company: offer.company,
        ctc: offer.ctc / 100000,
        inHand: offer.inHandEst / 100000,
        date: formatDate(offer.uploadDate),
      }))
  }

  const prepareCompanyDistribution = () => {
    const companyCount = savedOffers.reduce(
      (acc, offer) => {
        acc[offer.company] = (acc[offer.company] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(companyCount).map(([company, count]) => ({
      company,
      count,
      percentage: (count / savedOffers.length) * 100,
    }))
  }

  const prepareCTCBreakdown = (offer: SavedOffer) => {
    const components = [
      { name: "Base Salary", value: offer.base, color: "hsl(var(--chart-1))" },
      { name: "HRA", value: offer.hra || 0, color: "hsl(var(--chart-2))" },
      { name: "Bonus", value: offer.bonus || 0, color: "hsl(var(--chart-3))" },
      { name: "PF", value: offer.pf || 0, color: "hsl(var(--chart-4))" },
      { name: "Medical", value: offer.medical || 0, color: "hsl(var(--chart-5))" },
      { name: "LTA", value: offer.lta || 0, color: "hsl(var(--accent))" },
      { name: "Special Allowance", value: offer.specialAllowance || 0, color: "hsl(var(--primary))" },
    ].filter((component) => component.value > 0)

    return components
  }

  const calculateOfferInsights = (offer: SavedOffer): OfferInsights => {
    const takeHomePercentage = ((offer.inHandEst * 12) / offer.ctc) * 100
    const bonusPercentage = offer.bonus ? (offer.bonus / offer.ctc) * 100 : 0
    const pfPercentage = offer.pf ? (offer.pf / offer.ctc) * 100 : 0

    const variableComponents = offer.bonus || 0
    const variablePercentage = (variableComponents / offer.ctc) * 100
    const fixedPercentage = 100 - variablePercentage

    const warnings: string[] = []
    const recommendations: string[] = []

    // Generate warnings based on analysis
    if (variablePercentage > 25) {
      warnings.push(`⚠️ ${variablePercentage.toFixed(1)}% of your salary is variable, not guaranteed`)
    }

    if (takeHomePercentage < 55) {
      warnings.push(`⚠️ Low take-home ratio: Only ${takeHomePercentage.toFixed(1)}% reaches your account`)
    }

    if (bonusPercentage > 30) {
      warnings.push(`⚠️ High bonus dependency: ${bonusPercentage.toFixed(1)}% depends on performance`)
    }

    if (!offer.hra || offer.hra === 0) {
      warnings.push(`⚠️ No HRA component found - may affect tax savings`)
    }

    // Generate recommendations
    if (takeHomePercentage > 65) {
      recommendations.push(`✅ Excellent take-home ratio of ${takeHomePercentage.toFixed(1)}%`)
    }

    if (variablePercentage < 15) {
      recommendations.push(`✅ Good salary stability with ${fixedPercentage.toFixed(1)}% fixed components`)
    }

    if (offer.pf && pfPercentage > 8) {
      recommendations.push(`✅ Good PF contribution for retirement planning`)
    }

    return {
      takeHomePercentage,
      bonusPercentage,
      pfPercentage,
      variablePercentage,
      fixedPercentage,
      warnings,
      recommendations,
    }
  }

  const toggleComparison = (offerId: string) => {
    setComparisonOffers((prev) => {
      if (prev.includes(offerId)) {
        return prev.filter((id) => id !== offerId)
      } else if (prev.length < 2) {
        return [...prev, offerId]
      } else {
        return [prev[1], offerId] // Replace first with new selection
      }
    })
  }

  const currentOffer = selectedOffer ? savedOffers.find((offer) => offer._id === selectedOffer) : null
  const currentInsights = currentOffer ? calculateOfferInsights(currentOffer) : null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (savedOffers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-accent" />
            </div>
            <CardTitle className="font-serif">No Offers Yet</CardTitle>
            <CardDescription>
              Upload your first offer letter to start building your salary analysis dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={onUploadMore}
              className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Your First Offer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in-0 slide-in-from-top-4 duration-500">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-accent to-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              Your Salary Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage and analyze your {savedOffers.length} saved offer{savedOffers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onUploadMore}
            className="transition-all duration-200 hover:scale-105 border-accent/30 hover:bg-accent/10 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload More
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Award,
              label: "Highest CTC",
              value: formatLakhs(userStats.highestCTC),
              subtitle: "Best offer",
              gradient: "from-green-500/20 to-emerald-500/20",
              iconColor: "text-green-600",
            },
            {
              icon: TrendingUp,
              label: "Average CTC",
              value: formatLakhs(userStats.averageCTC),
              subtitle: "Across all offers",
              gradient: "from-accent/20 to-primary/20",
              iconColor: "text-accent",
            },
            {
              icon: PiggyBank,
              label: "Avg. In-Hand",
              value: formatLakhs(userStats.averageInHand),
              subtitle: "Monthly take-home",
              gradient: "from-blue-500/20 to-cyan-500/20",
              iconColor: "text-blue-600",
            },
            {
              icon: Building2,
              label: "Total Offers",
              value: userStats.totalOffers.toString(),
              subtitle: "Analyzed",
              gradient: "from-purple-500/20 to-pink-500/20",
              iconColor: "text-purple-600",
            },
          ].map((metric, index) => (
            <Card
              key={index}
              className={`border border-accent/20 bg-gradient-to-br ${metric.gradient} transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <metric.icon className={`w-4 h-4 mr-2 ${metric.iconColor}`} />
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                <p className="text-sm text-muted-foreground">{metric.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {currentOffer && (
              <Card className="border border-accent/20 bg-gradient-to-br from-card to-accent/5">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center">
                    <PiggyBank className="w-5 h-5 mr-2 text-accent" />
                    CTC Breakdown - {currentOffer.company}
                  </CardTitle>
                  <CardDescription>Detailed salary component analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareCTCBreakdown(currentOffer)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {prepareCTCBreakdown(currentOffer).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              const percentage = ((data.value / currentOffer.ctc) * 100).toFixed(1)
                              return (
                                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-accent font-semibold">{formatLakhs(data.value)}</p>
                                  <p className="text-sm text-muted-foreground">{percentage}% of CTC</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {currentOffer && currentInsights && (
              <Card className="border border-accent/20 bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-primary" />
                    Salary Insights
                  </CardTitle>
                  <CardDescription>AI-powered analysis of your offer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-700">
                        {currentInsights.takeHomePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-600">Take-home ratio</div>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-700">
                        {currentInsights.variablePercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-blue-600">Variable component</div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {currentInsights.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-orange-700">⚠️ Important Notes:</h4>
                      {currentInsights.warnings.map((warning, index) => (
                        <Alert key={index} className="bg-orange-50 border-orange-200 py-2">
                          <AlertDescription className="text-orange-800 text-sm">{warning}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {currentInsights.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-green-700">✅ Positive Highlights:</h4>
                      {currentInsights.recommendations.map((rec, index) => (
                        <Alert key={index} className="bg-green-50 border-green-200 py-2">
                          <AlertDescription className="text-green-800 text-sm">{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Offer Trend Chart */}
          <Card className="border border-accent/20 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                Offer Progression
              </CardTitle>
              <CardDescription>Your CTC growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareOfferTrendData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.company}</p>
                              <p className="text-accent font-semibold">CTC: ₹{data.ctc}L</p>
                              <p className="text-sm text-muted-foreground">Date: {data.date}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ctc"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 6 }}
                      name="CTC (₹L)"
                    />
                    <Line
                      type="monotone"
                      dataKey="inHand"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 4 }}
                      name="In-Hand (₹L)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Company Distribution */}
          <Card className="border border-accent/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-primary" />
                Company Distribution
              </CardTitle>
              <CardDescription>Offers by company</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prepareCompanyDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {prepareCompanyDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.company}</p>
                              <p className="text-accent font-semibold">
                                {data.count} offer{data.count !== 1 ? "s" : ""}
                              </p>
                              <p className="text-sm text-muted-foreground">{data.percentage.toFixed(1)}% of total</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Recent Offers */}
          <Card className="border border-accent/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <History className="w-5 h-5 mr-2 text-accent" />
                Recent Offers
              </CardTitle>
              <CardDescription>Your latest salary analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedOffers.slice(0, 5).map((offer, index) => (
                  <div
                    key={offer._id}
                    className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md hover:scale-102 cursor-pointer animate-in fade-in-0 slide-in-from-left-4 duration-300 ${
                      selectedOffer === offer._id
                        ? "border-accent bg-gradient-to-r from-accent/10 to-primary/10"
                        : "border-border hover:border-accent/50 bg-card"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => setSelectedOffer(offer._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedOffer === offer._id ? "bg-gradient-to-r from-accent/20 to-primary/20" : "bg-muted"
                          }`}
                        >
                          <Building2
                            className={`w-6 h-6 ${
                              selectedOffer === offer._id ? "text-accent" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{offer.company}</h3>
                          <p className="text-sm text-muted-foreground">{offer.position || "Software Engineer"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(offer.uploadDate)}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold text-accent">{formatLakhs(offer.ctc)}</div>
                        <div className="text-sm text-muted-foreground">{formatLakhs(offer.inHandEst)}/month</div>
                        {getConfidenceBadge(offer.confidence)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card className="border border-accent/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <FileText className="w-5 h-5 mr-2 text-accent" />
                All Offers ({savedOffers.length})
              </CardTitle>
              <CardDescription>Complete history of your salary analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedOffers.map((offer, index) => (
                  <div
                    key={offer._id}
                    className="p-5 rounded-xl border border-accent/20 bg-gradient-to-r from-card to-accent/5 transition-all duration-300 hover:shadow-lg hover:scale-102 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-accent" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{offer.company}</h3>
                          <p className="text-muted-foreground">{offer.position || "Software Engineer"}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{formatDate(offer.uploadDate)}</span>
                            {offer.fileName && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">{offer.fileName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-accent">{formatLakhs(offer.ctc)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatLakhs(offer.inHandEst)}/month in-hand
                        </div>
                        <div className="flex items-center gap-2">
                          {getConfidenceBadge(offer.confidence)}
                          {offer.extractionMethod && (
                            <Badge variant="outline" className="text-xs">
                              {offer.extractionMethod.replace("-", " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Salary Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="p-2 bg-card/50 rounded-lg">
                        <span className="text-xs text-muted-foreground">Base</span>
                        <div className="font-semibold text-sm">{formatLakhs(offer.base)}</div>
                      </div>
                      {offer.bonus && offer.bonus > 0 && (
                        <div className="p-2 bg-card/50 rounded-lg">
                          <span className="text-xs text-muted-foreground">Bonus</span>
                          <div className="font-semibold text-sm">{formatLakhs(offer.bonus)}</div>
                        </div>
                      )}
                      {offer.hra && offer.hra > 0 && (
                        <div className="p-2 bg-card/50 rounded-lg">
                          <span className="text-xs text-muted-foreground">HRA</span>
                          <div className="font-semibold text-sm">{formatLakhs(offer.hra)}</div>
                        </div>
                      )}
                      {offer.pf && offer.pf > 0 && (
                        <div className="p-2 bg-card/50 rounded-lg">
                          <span className="text-xs text-muted-foreground">PF</span>
                          <div className="font-semibold text-sm">{formatLakhs(offer.pf)}</div>
                        </div>
                      )}
                    </div>

                    {/* Warnings */}
                    {offer.warnings && offer.warnings.length > 0 && (
                      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 text-xs">
                          <strong>Extraction Notes:</strong> {offer.warnings.slice(0, 2).join("; ")}
                          {offer.warnings.length > 2 && "..."}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-accent/20">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOffer(offer._id)}
                          className="text-accent hover:bg-accent/10"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOffer(offer._id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="border border-accent/20">
              <CardHeader>
                <CardTitle className="font-serif flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-accent" />
                  Offer Comparison
                </CardTitle>
                <CardDescription>Select up to 2 offers to compare</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {savedOffers.slice(0, 6).map((offer) => (
                    <div
                      key={offer._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        comparisonOffers.includes(offer._id)
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                      onClick={() => toggleComparison(offer._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{offer.company}</div>
                          <div className="text-sm text-muted-foreground">{formatLakhs(offer.ctc)}</div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded border-2 ${
                            comparisonOffers.includes(offer._id) ? "bg-accent border-accent" : "border-muted-foreground"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {comparisonOffers.length === 2 && (
                  <Button
                    onClick={() => setShowComparison(true)}
                    className="w-full mt-4 bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90"
                  >
                    Compare Selected Offers
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Overview */}
            <Card className="border border-accent/20">
              <CardHeader>
                <CardTitle className="font-serif flex items-center">
                  <Award className="w-5 h-5 mr-2 text-primary" />
                  Portfolio Overview
                </CardTitle>
                <CardDescription>Your offer analysis summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <span className="text-sm font-medium">Best Take-home Ratio</span>
                    <span className="font-bold text-green-700">
                      {Math.max(
                        ...savedOffers.map((offer) => calculateOfferInsights(offer).takeHomePercentage),
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <span className="text-sm font-medium">Most Stable Offer</span>
                    <span className="font-bold text-blue-700">
                      {
                        savedOffers.reduce((best, offer) => {
                          const insights = calculateOfferInsights(offer)
                          const bestInsights = calculateOfferInsights(best)
                          return insights.fixedPercentage > bestInsights.fixedPercentage ? offer : best
                        }).company
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <span className="text-sm font-medium">Average CTC Growth</span>
                    <span className="font-bold text-purple-700">
                      {savedOffers.length > 1
                        ? `${(((savedOffers[savedOffers.length - 1].ctc - savedOffers[0].ctc) / savedOffers[0].ctc) * 100).toFixed(1)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <Card className="border border-accent/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-accent" />
                Detailed Analytics
              </CardTitle>
              <CardDescription>Comprehensive analysis of all your offers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {savedOffers.map((offer, index) => {
                  const insights = calculateOfferInsights(offer)
                  return (
                    <div
                      key={offer._id}
                      className="p-5 rounded-xl border border-accent/20 bg-gradient-to-r from-card to-accent/5 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{offer.company}</h3>
                          <p className="text-muted-foreground">{formatLakhs(offer.ctc)} CTC</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-accent">
                            {insights.takeHomePercentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Take-home</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="p-2 bg-card/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-green-600">{insights.fixedPercentage.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Fixed</div>
                        </div>
                        <div className="p-2 bg-card/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {insights.variablePercentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Variable</div>
                        </div>
                        <div className="p-2 bg-card/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-blue-600">{insights.bonusPercentage.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Bonus</div>
                        </div>
                        <div className="p-2 bg-card/50 rounded-lg text-center">
                          <div className="text-lg font-bold text-purple-600">{insights.pfPercentage.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">PF</div>
                        </div>
                      </div>

                      {insights.warnings.length > 0 && (
                        <div className="space-y-1">
                          {insights.warnings.slice(0, 2).map((warning, wIndex) => (
                            <div key={wIndex} className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          {/* Management features would go here */}
          <Card className="border border-accent/20">
            <CardHeader>
              <CardTitle className="font-serif flex items-center">
                <Edit className="w-5 h-5 mr-2 text-accent" />
                Manage Offers
              </CardTitle>
              <CardDescription>Edit, export, and organize your salary data</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="w-8 h-8 text-accent" />
              </div>
              <p className="text-muted-foreground">Management features are coming soon!</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showComparison && comparisonOffers.length === 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="font-serif flex items-center justify-between">
                <span className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-accent" />
                  Offer Comparison
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComparison(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const offer1 = savedOffers.find((o) => o._id === comparisonOffers[0])!
                const offer2 = savedOffers.find((o) => o._id === comparisonOffers[1])!
                const insights1 = calculateOfferInsights(offer1)
                const insights2 = calculateOfferInsights(offer2)

                return (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { offer: offer1, insights: insights1 },
                      { offer: offer2, insights: insights2 },
                    ].map(({ offer, insights }, index) => (
                      <div key={offer._id} className="space-y-4">
                        <div className="text-center p-4 bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg">
                          <h3 className="text-xl font-bold">{offer.company}</h3>
                          <p className="text-2xl font-bold text-accent">{formatLakhs(offer.ctc)}</p>
                          <p className="text-muted-foreground">{formatLakhs(offer.inHandEst)}/month</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Take-home Ratio</span>
                            <span className="font-bold">{insights.takeHomePercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fixed Components</span>
                            <span className="font-bold text-green-600">{insights.fixedPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Variable Components</span>
                            <span className="font-bold text-orange-600">{insights.variablePercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bonus Percentage</span>
                            <span className="font-bold text-blue-600">{insights.bonusPercentage.toFixed(1)}%</span>
                          </div>
                        </div>

                        {insights.warnings.length > 0 && (
                          <div className="space-y-1">
                            <h4 className="font-semibold text-sm text-orange-700">Warnings:</h4>
                            {insights.warnings.map((warning, wIndex) => (
                              <div key={wIndex} className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                                {warning}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
