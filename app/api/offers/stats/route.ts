import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/middleware"

// Get user's offer statistics
export const GET = withAuth(async (request) => {
  try {
    const { db } = await connectToDatabase()

    const offers = await db.collection("offers").find({ userId: request.user!.userId }).toArray()

    if (offers.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalOffers: 0,
          averageCTC: 0,
          highestCTC: 0,
          lowestCTC: 0,
          averageInHand: 0,
          topCompanies: [],
          recentUploads: 0,
        },
      })
    }

    const ctcValues = offers.map((offer) => offer.ctc).filter(Boolean)
    const inHandValues = offers.map((offer) => offer.inHandEst).filter(Boolean)

    // Company frequency
    const companyCount = offers.reduce(
      (acc, offer) => {
        if (offer.company) {
          acc[offer.company] = (acc[offer.company] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const topCompanies = Object.entries(companyCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }))

    // Recent uploads (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentUploads = offers.filter((offer) => new Date(offer.uploadDate) > thirtyDaysAgo).length

    const stats = {
      totalOffers: offers.length,
      averageCTC: ctcValues.length > 0 ? Math.round(ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length) : 0,
      highestCTC: ctcValues.length > 0 ? Math.max(...ctcValues) : 0,
      lowestCTC: ctcValues.length > 0 ? Math.min(...ctcValues) : 0,
      averageInHand:
        inHandValues.length > 0 ? Math.round(inHandValues.reduce((a, b) => a + b, 0) / inHandValues.length) : 0,
      topCompanies,
      recentUploads,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return NextResponse.json({ error: "Failed to retrieve statistics" }, { status: 500 })
  }
})
