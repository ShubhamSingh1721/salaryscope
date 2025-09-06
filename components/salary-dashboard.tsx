"use client"

// import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { OfferType } from "@/types/offer"
import React, { useState, useEffect } from "react"

import {
  Building2,
  TrendingUp,
  PiggyBank,
  Calculator,
  Compass as Compare,
  FileText,
  Award,
  Calendar,
  MapPin,
  Users,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts"

// Gemini ka response ke hisaab se normalized salary type
interface SalaryData {
  id: string
  company: string
  position: string
  location: string
  experience: string
  ctc: number
  baseAmount: number
  bonus: number
  benefits: number
  stocks: number
  joiningBonus: number
  taxDeduction: number
  takeHome: number
  monthlyTakeHome: number
  workingDays: number
  vacationDays: number
  healthInsurance: number
  retirementContribution: number
}

interface SalaryDashboardProps {
  processedFiles: OfferType[]
  onBackToUpload?: () => void
}

export function SalaryDashboard({ processedFiles = [], onBackToUpload }: SalaryDashboardProps) {
  // processedFiles -> Gemini ke response directly

  const salaryData: SalaryData[] = processedFiles.map((file) => ({
    id: file.id,
    company: file.company ?? "Unknown",
    position: file.position ?? "Not specified",
    location: file.location ?? "Unknown",
    experience: String(file.experience ?? "0"),

    ctc: Number(file.ctc) || 0,
    baseAmount: Number(file.baseAmount) || 0,
    bonus: Number(file.bonus) || 0,
    benefits: Number(file.benefits) || 0,
    stocks: Number(file.stocks) || 0,
    joiningBonus: Number(file.joiningBonus) || 0,

    taxDeduction: Number(file.taxDeduction) || 0,
    takeHome: Number(file.takeHome) || Number(file.inHandEstimate) || 0,
    monthlyTakeHome: Math.floor((Number(file.takeHome) || Number(file.inHandEstimate) || 0) / 12),

    workingDays: Number(file.workingDays) || 0,
    vacationDays: Number(file.vacationDays) || 0,
    healthInsurance: Number(file.healthInsurance) || 0,
    retirementContribution: Number(file.retirementContribution) || 0,
  }))

  console.log("Normalized Salary Data:", salaryData);

  const [selectedOffer, setSelectedOffer] = useState<string>(salaryData[0]?.id ?? "")
  const [compareMode, setCompareMode] = useState(false)
  const [compareOffers, setCompareOffers] = useState<string[]>([])
  // const [parsedResult, setParsedResult] = useState<{ industryAverageCTC: number } | null>(null);



  const currentOffer = salaryData.find((offer) => offer.id === selectedOffer) || salaryData[0]
  const bestOffer =
    salaryData.length > 0
      ? salaryData.reduce((best, current) => (current.ctc > best.ctc ? current : best), salaryData[0])
      : null

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount)

  const formatLakhs = (amount: number) => `₹${(amount / 100000).toFixed(1)}L`

  const toggleCompareOffer = (offerId: string) => {
    if (compareOffers.includes(offerId)) {
      setCompareOffers(compareOffers.filter((id) => id !== offerId))
    } else if (compareOffers.length < 3) {
      setCompareOffers([...compareOffers, offerId])
    }
  }

  const prepareCTCBreakdownData = (offer: SalaryData) => [
    { name: "Base Salary", value: offer.baseAmount, color: "hsl(var(--chart-1))" },
    { name: "Performance Bonus", value: offer.bonus, color: "hsl(var(--chart-2))" },
    { name: "Stock Options", value: offer.stocks, color: "hsl(var(--chart-3))" },
    { name: "Benefits & Perks", value: offer.benefits, color: "hsl(var(--chart-4))" },
  ]

  const prepareTaxBreakdownData = (offer: SalaryData) => [
    { name: "Take Home", value: offer.takeHome, color: "hsl(var(--chart-1))" },
    { name: "Income Tax", value: offer.taxDeduction, color: "hsl(var(--chart-3))" },
    { name: "PF Contribution", value: offer.retirementContribution, color: "hsl(var(--chart-4))" },
  ]

  const prepareComparisonData = () =>
    salaryData.map((offer) => ({
      company: offer.company,
      ctc: offer.ctc / 100000,
      takeHome: offer.takeHome / 100000,
      base: offer.baseAmount / 100000,
      bonus: offer.bonus / 100000,
      stocks: offer.stocks / 100000,
    }))

  const prepareMonthlyFlowData = (offer: SalaryData) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.map((month, index) => ({
      month,
      gross: offer.ctc / 12 / 100000,
      takeHome: offer.monthlyTakeHome / 100000,
      actual: index === 0 ? (offer.monthlyTakeHome + offer.joiningBonus) / 100000 : offer.monthlyTakeHome / 100000,
    }))
  }

  const chartConfig = {
    ctc: { label: "CTC", color: "hsl(var(--chart-1))" },
    takeHome: { label: "Take Home", color: "hsl(var(--chart-2))" },
    base: { label: "Base", color: "hsl(var(--chart-3))" },
    bonus: { label: "Bonus", color: "hsl(var(--chart-4))" },
    stocks: { label: "Stocks", color: "hsl(var(--chart-5))" },
  }

  if (!salaryData.length) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No offers processed yet. Please upload an offer letter.</p>
      </div>
    )
  }




//  useEffect(() => {
//   async function fetchData() {
//     try {
//       const res = await fetch("/api/upload");
//       const data = await res.json();
//       setParsedResult({ industryAverageCTC: data?.data?.industryAverageCTC ?? 0 });
//     } catch (err) {
//       console.error("Failed to fetch industry average CTC:", err);
//       setParsedResult({ industryAverageCTC: 0 });
//     }
//   }
//   fetchData();
// }, []);


  return (
    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in-0 slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Salary Analysis Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive breakdown of {salaryData.length} offer{salaryData.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCompareMode(!compareMode)}
            className={`transition-all duration-300 hover:scale-105 ${compareMode ? "bg-accent text-accent-foreground shadow-lg" : ""}`}
          >
            <Compare className="w-4 h-4 mr-2" />
            {compareMode ? "Exit Compare" : "Compare Offers"}
          </Button>
          {onBackToUpload && (
            <Button
              variant="outline"
              onClick={onBackToUpload}
              className="transition-all duration-200 hover:scale-105 bg-transparent"
            >
              <FileText className="w-4 h-4 mr-2" />
              Upload More
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: Award,
            label: "Best Offer",
            value: formatLakhs(bestOffer?.ctc ?? 0),
            subtitle: bestOffer?.company ?? "Unknown"
          },
          {
            icon: TrendingUp,
            label: "Average CTC",
            value: salaryData.length
              ? formatLakhs(salaryData.reduce((sum, offer) => sum + offer.ctc, 0) / salaryData.length)
              : "0",
            subtitle: "+12% above market",
          },
          {
            icon: PiggyBank,
            label: "Best Take-Home",
            value: salaryData.length
              ? (
                <>
                  ₹{Math.max(...salaryData.map((offer) => offer.monthlyTakeHome ?? 0)).toLocaleString()}{" "}
                  <span style={{ fontSize: "0.6em", fontWeight: "normal" }}>(approx)</span>
                </>
              )
              : (
                <>
                  ₹0 <span style={{ fontSize: "0.8em", fontWeight: "normal" }}>(approx)</span>
                </>
              ),
            subtitle: "After taxes",
          },



          {
            icon: Building2,
            label: "Total Offers",
            value: salaryData.length.toString() ?? "0",
            subtitle: "Analyzed"
          },
        ]
          .map((metric, index) => (
            <Card
              key={index}
              className={`border-border bg-card transition-all duration-300 hover:shadow-lg hover:scale-105 animate-in fade-in-0 slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <metric.icon className="w-4 h-4 mr-2" />
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

      <div className="grid md:grid-cols-2 gap-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
        {/* Offers Comparison Chart */}
        <Card className="border-border bg-card transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif">Offers Comparison</CardTitle>
            <CardDescription>CTC and Take-home comparison across all offers</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ctc" fill="var(--color-ctc)" name="CTC (₹L)" />
                  <Bar dataKey="takeHome" fill="var(--color-takeHome)" name="Take Home (₹L)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Cash Flow */}
        <Card className="border-border bg-card transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif">Monthly Cash Flow</CardTitle>
            <CardDescription>Expected monthly earnings for {currentOffer.company}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prepareMonthlyFlowData(currentOffer)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="var(--color-ctc)"
                    fill="var(--color-ctc)"
                    fillOpacity={0.3}
                    name="Actual (₹L)"
                  />
                  <Area
                    type="monotone"
                    dataKey="takeHome"
                    stroke="var(--color-takeHome)"
                    fill="var(--color-takeHome)"
                    fillOpacity={0.6}
                    name="Regular (₹L)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Offer Selection */}
      {!compareMode && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-serif">Select Offer to Analyze</CardTitle>
            <CardDescription>Choose an offer to view detailed breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salaryData.map((offer, index) => (
                <div
                  key={offer.id ?? `${offer.company}-${offer.position}-${index}`}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedOffer === offer.id
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                    }`}
                  onClick={() => setSelectedOffer(offer.id ?? index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{offer.company}</h3>
                    <Badge variant={selectedOffer === offer.id ? "default" : "secondary"}>
                      {formatLakhs(offer.ctc)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{offer.position}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {offer.location}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Mode */}
      {/* Compare Mode */}
      {compareMode && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="font-serif">Compare Offers</CardTitle>
            <CardDescription>Select up to 3 offers to compare side by side</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {salaryData.map((offer) => (
                <div
                  key={offer.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${compareOffers.includes(offer.id)
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                    }`}
                  onClick={() => toggleCompareOffer(offer.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{offer.company}</h3>
                    <Badge variant={compareOffers.includes(offer.id) ? "default" : "secondary"}>
                      {formatLakhs(offer.ctc)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{offer.position}</p>
                </div>
              ))}
            </div>

            {compareOffers.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Comparison Results</h3>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-serif">Detailed Comparison Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={salaryData
                            .filter((offer) => compareOffers.includes(offer.id))
                            .map((offer) => ({
                              company: offer.company,
                              base: offer.baseAmount / 100000,
                              bonus: offer.bonus / 100000,
                              stocks: offer.stocks / 100000,
                              benefits: offer.benefits / 100000,
                            }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="company" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          {/* Custom Colors Here */}
                          <Bar dataKey="base" stackId="a" fill="#3b82f6" name="Base (₹L)" /> {/* Blue */}
                          <Bar dataKey="bonus" stackId="a" fill="#10b981" name="Bonus (₹L)" /> {/* Green */}
                          <Bar dataKey="stocks" stackId="a" fill="#f59e0b" name="Stocks (₹L)" /> {/* Amber */}
                          <Bar dataKey="benefits" stackId="a" fill="#8b5cf6" name="Benefits (₹L)" /> {/* Purple */}
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <div className="grid gap-6">
                  {/* CTC Comparison */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Total CTC</h4>
                    {compareOffers.map((offerId) => {
                      const offer = salaryData.find((o) => o.id === offerId)!
                      const maxCtc = Math.max(
                        ...compareOffers.map((id) => salaryData.find((o) => o.id === id)!.ctc)
                      )
                      return (
                        <div key={offerId} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium">{offer.company}</div>
                          <div className="flex-1">
                            <Progress
                              value={(offer.ctc / maxCtc) * 100}
                              color="bg-blue-500"
                              className="h-2 bg-gray-200"
                            />

                          </div>
                          <div className="w-20 text-sm font-semibold text-right">
                            {formatLakhs(offer.ctc)}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Take-Home Comparison */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground">Take-Home Salary</h4>
                    {compareOffers.map((offerId) => {
                      const offer = salaryData.find((o) => o.id === offerId)!
                      const maxTakeHome = Math.max(
                        ...compareOffers.map(
                          (id) => salaryData.find((o) => o.id === id)!.monthlyTakeHome ?? 0
                        )
                      )

                      return (
                        <div key={offerId} className="flex items-center gap-4">
                          <div className="w-24 text-sm font-medium">{offer.company}</div>
                          <div className="flex-1">
                            <Progress
                              value={((offer.monthlyTakeHome ?? 0) / maxTakeHome) * 100}
                              color="bg-green-500"
                              className="h-2 bg-gray-200"
                            />

                          </div>
                          <div className="w-20 text-sm font-semibold text-right">
                            {formatLakhs(offer.takeHome)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Detailed Analysis */}
      {!compareMode && (
        <Tabs defaultValue="breakdown" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="breakdown">CTC Breakdown</TabsTrigger>
            <TabsTrigger value="taxes">Tax Analysis</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">CTC Components</CardTitle>
                  <CardDescription>
                    {currentOffer.company} - {formatCurrency(currentOffer.ctc)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pie Chart */}
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareCTCBreakdownData(currentOffer)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {prepareCTCBreakdownData(currentOffer).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-accent font-semibold">{formatCurrency(data.value)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {((data.value / currentOffer.ctc) * 100).toFixed(1)}% of CTC
                                  </p>
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

                  {/* Detailed breakdown */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Base Salary</span>
                        <span className="font-semibold">{formatCurrency(currentOffer.baseAmount)}</span>
                      </div>
                      <Progress
                        value={(currentOffer.baseAmount / currentOffer.ctc) * 100}
                        className="h-2 bg-gray-200 [&>div]:bg-blue-500"
                      />


                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Performance Bonus</span>
                        <span className="font-semibold">{formatCurrency(currentOffer.bonus)}</span>
                      </div>
                      <Progress
                        value={(currentOffer.bonus / currentOffer.ctc) * 100}
                        className="h-2 bg-gray-200 [&>div]:bg-blue-500"
                      />




                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Stock Options</span>
                        <span className="font-semibold">{formatCurrency(currentOffer.stocks)}</span>
                      </div>
                      <Progress
                        value={(currentOffer.stocks / currentOffer.ctc) * 100}
                        className="h-2 bg-gray-200 [&>div]:bg-blue-500"
                      />

                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Benefits & Perks</span>
                        <span className="font-semibold">{formatCurrency(currentOffer.benefits)}</span>
                      </div>
                      <Progress
                        value={(currentOffer.benefits / currentOffer.ctc) * 100}
                        className="h-2 bg-gray-200 [&>div]:bg-blue-500"
                      />

                    </div>

                    {currentOffer.joiningBonus > 0 && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Joining Bonus</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(currentOffer.joiningBonus)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Breakdown */}
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Monthly Breakdown</CardTitle>
                  <CardDescription>Your monthly financial picture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent/5 rounded-lg">
                    <span className="font-medium text-foreground">Monthly Take-Home</span>
                    <span className="text-xl font-bold text-accent">
                      {formatCurrency(currentOffer.monthlyTakeHome)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Gross Monthly</span>
                      <span className="font-medium">{formatCurrency(currentOffer.ctc / 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tax Deduction</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(currentOffer.taxDeduction / 12)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">PF Contribution</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(currentOffer.retirementContribution / 12)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="taxes" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Tax Analysis</CardTitle>
                  <CardDescription>Detailed tax breakdown and optimization suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Tax Breakdown</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Taxable Income</span>
                        <span className="font-medium">
                          {formatCurrency(currentOffer.baseAmount + currentOffer.bonus)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Income Tax</span>
                        <span className="font-medium text-red-600">{formatCurrency(currentOffer.taxDeduction)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Effective Tax Rate</span>
                        <span className="font-medium">
                          {((currentOffer.taxDeduction / (currentOffer.baseAmount + currentOffer.bonus)) * 100).toFixed(
                            1,
                          )}
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Savings Opportunities</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-green-800">80C Deductions</p>
                          <p className="text-xs text-green-600">Save up to ₹46,800 annually</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800">Health Insurance</p>
                          <p className="text-xs text-blue-600">Additional ₹25,000 deduction</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Tax Distribution</CardTitle>
                  <CardDescription>Visual breakdown of your salary after deductions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareTaxBreakdownData(currentOffer)}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {prepareTaxBreakdownData(currentOffer).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? "#3b82f6" // Take Home - Blue
                                  : index === 1
                                    ? "#ef4444" // Income Tax - Red
                                    : "#8b5cf6" // PF Contribution - Purple
                              }
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-medium">{data.name}</p>
                                  <p className="text-accent font-semibold">{formatCurrency(data.value)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {((data.value / currentOffer.ctc) * 100).toFixed(1)}% of CTC
                                  </p>
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
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Work-Life Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Working Days/Year</span>
                    </div>
                    <span className="font-medium">{currentOffer.workingDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PiggyBank className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Vacation Days</span>
                    </div>
                    <span className="font-medium">{currentOffer.vacationDays}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">Experience Level</span>
                    </div>
                    <span className="font-medium">{currentOffer.experience}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Health & Retirement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Health Insurance</span>
                    <span className="font-medium">{formatCurrency(currentOffer.healthInsurance)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">PF Contribution</span>
                    <span className="font-medium">{formatCurrency(currentOffer.retirementContribution)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Benefits Value</span>
                    <span className="font-semibold text-accent">{formatCurrency(currentOffer.benefits)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6">
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Market Analysis</CardTitle>
                  <CardDescription>How your offer compares to market standards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="font-medium text-green-800">“Here’s how your offer stacks up in the market.”
                      </p>
                      {/* <p className="text-sm text-green-600">“Here’s how your offer stacks up in the market.”
</p> */}
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
  <p className="text-sm text-muted-foreground">Industry Average</p>
  <p className="text-xl font-bold text-foreground">₹18.5L</p>
</div>



                    <div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
                      <p className="text-sm text-muted-foreground">Your Offer</p>
                      <p className="text-xl font-bold text-accent">{formatLakhs(currentOffer.ctc)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-serif">Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Calculator className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Negotiate Stock Options</p>
                      <p className="text-xs text-blue-600">
                        Consider asking for higher equity component for long-term gains
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <PiggyBank className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Optimize Tax Savings</p>
                      <p className="text-xs text-yellow-600">Maximize 80C deductions to save ₹46,800 annually</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Award className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Strong Offer</p>
                      <p className="text-xs text-green-600">
                        This offer is competitive and well-structured for your experience level
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
