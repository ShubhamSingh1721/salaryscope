import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { withAuth } from "@/lib/middleware"
import { ObjectId } from "mongodb"

// Get specific offer
export const GET = withAuth(async (request, { params }: { params: { id: string } }) => {
  try {
    const { db } = await connectToDatabase()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 })
    }

    const offer = await db.collection("offers").findOne({
      _id: new ObjectId(params.id),
      userId: request.user!.userId,
    })

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      offer: {
        ...offer,
        _id: offer._id.toString(),
      },
    })
  } catch (error) {
    console.error("Get offer error:", error)
    return NextResponse.json({ error: "Failed to retrieve offer" }, { status: 500 })
  }
})

// Update offer
export const PUT = withAuth(async (request, { params }: { params: { id: string } }) => {
  try {
    const updates = await request.json()
    const { db } = await connectToDatabase()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 })
    }

    const result = await db.collection("offers").findOneAndUpdate(
      {
        _id: new ObjectId(params.id),
        userId: request.user!.userId,
      },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      offer: {
        ...result,
        _id: result._id.toString(),
      },
    })
  } catch (error) {
    console.error("Update offer error:", error)
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 })
  }
})

// Delete offer
export const DELETE = withAuth(async (request, { params }: { params: { id: string } }) => {
  try {
    const { db } = await connectToDatabase()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid offer ID" }, { status: 400 })
    }

    const result = await db.collection("offers").deleteOne({
      _id: new ObjectId(params.id),
      userId: request.user!.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Offer deleted successfully",
    })
  } catch (error) {
    console.error("Delete offer error:", error)
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 })
  }
})
