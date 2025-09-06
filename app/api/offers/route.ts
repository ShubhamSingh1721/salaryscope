import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/middleware"
import { ObjectId } from "mongodb"
import type { Offer } from "@/lib/models/Offer"

// Get all offers for authenticated user
export const GET = withAuth(async (request) => {
  try {
    const { db } = await connectToDatabase()

    const offers = await db
      .collection("offers")
      .find({ userId: request.user!.userId })
      .sort({ uploadDate: -1 })
      .toArray()

    const formattedOffers = offers.map((offer) => ({
      ...offer,
      _id: offer._id.toString(),
    }))

    return NextResponse.json({
      success: true,
      offers: formattedOffers,
    })
  } catch (error) {
    console.error("Get offers error:", error)
    return NextResponse.json({ error: "Failed to retrieve offers" }, { status: 500 })
  }
})

// Create new offer (alternative to upload route)


// POST
export const POST = withAuth(async (request) => {
  try {
    const offerData = await request.json()
    const { db } = await connectToDatabase()

    // Remove _id if it exists in offerData
    const { _id, ...offerWithoutId } = offerData

    const newOffer = {
      ...offerWithoutId,
      userId: request.user!.userId,
      uploadDate: new Date(),
    }

    const result = await db.collection("offers").insertOne(newOffer)

    // Convert MongoDB ObjectId to string for frontend
    const savedOffer = { ...newOffer, _id: result.insertedId.toString() }

    return NextResponse.json({
      success: true,
      offer: savedOffer,
    })
  } catch (error) {
    console.error("Create offer error:", error)
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 })
  }
})
