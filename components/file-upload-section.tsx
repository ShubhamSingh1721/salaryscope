"use client"

import React, { useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { OfferType } from "@/types/offer"
import { AlertCircle } from "lucide-react"
import { CheckCircle } from "lucide-react"

// ------------------ TYPES ------------------
interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  extractedData?: OfferType   // 👈 Gemini ka JSON direct OfferType banega
  error?: string
  fileObj?: File
}

interface FileUploadSectionProps {
  onFilesProcessed?: (files: OfferType[]) => void
}

// ------------------ HELPERS ------------------
const formatCurrency = (amount: any): string => {
  const num = typeof amount === "number" ? amount : Number(amount) || 0
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num)
}

// ------------------ COMPONENT ------------------
export function FileUploadSection({ onFilesProcessed }: FileUploadSectionProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ------------------ FILE VALIDATION ------------------
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) return `${file.name}: File type not supported.`
    if (file.size > 5 * 1024 * 1024) return `${file.name}: File size exceeds 5MB.`
    return null
  }

  // ------------------ FILE PROCESS ------------------
  const processFile = async (uploadedFile: UploadedFile): Promise<UploadedFile> => {
    const { fileObj, id } = uploadedFile
    if (!fileObj) return { ...uploadedFile, status: "error", error: "No file data" }

    try {
      const formData = new FormData()
      formData.append("file", fileObj)

      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (!response.ok) throw new Error("Upload failed")
      const result = await response.json()

      uploadedFile.status = "completed"
      uploadedFile.progress = 100
      uploadedFile.extractedData = result.data as OfferType  // 👈 Gemini JSON direct use

      // Notify parent
      // if (onFilesProcessed) onFilesProcessed([uploadedFile.extractedData])
      return uploadedFile
    } catch (error: any) {
      uploadedFile.status = "error"
      uploadedFile.error = error.message || "Processing failed."
      return uploadedFile
    }
  }

  // ------------------ HANDLE FILES ------------------
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null)
      const fileArray = Array.from(files)

      const errors: string[] = []
      const validFiles: UploadedFile[] = []

      fileArray.forEach((file) => {
        const error = validateFile(file)
        if (error) errors.push(error)
        else
          validFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            status: "uploading",
            progress: 0,
            fileObj: file,
          })
      })

      if (uploadedFiles.length + validFiles.length > 5) errors.push("Maximum 5 files allowed")
      if (errors.length > 0) setUploadError(`Some files were rejected: ${errors.join("; ")}`)
      if (validFiles.length === 0) return

      setIsUploading(true)
      setUploadedFiles((prev) => [...prev, ...validFiles])

      try {
        const processedFiles = await Promise.all(validFiles.map(processFile))
        setUploadedFiles((prev) =>
          prev.map((file) => processedFiles.find((p) => p.id === file.id) || file)
        )
        const completedFiles = processedFiles.filter((f) => f.status === "completed")
        if (completedFiles.length && onFilesProcessed) {
          onFilesProcessed(completedFiles.map((f) => f.extractedData!) as OfferType[])
        }
      } catch {
        setUploadError("Failed to process files.")
      } finally {
        setIsUploading(false)
      }
    },
    [onFilesProcessed, uploadedFiles.length]
  )

  // ------------------ UI ------------------


return (
  <div className="space-y-6">
    <div className="text-center">
      <h2 className="text-2xl font-bold">Upload Your Offer Letters</h2>
      <p className="text-muted-foreground">AI-powered salary insights in seconds 🚀</p>
    </div>

    {uploadError && (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{uploadError}</AlertDescription>
      </Alert>
    )}

    <Card className="border-2 border-dashed shadow-sm hover:shadow-md transition">
      <CardContent className="p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files)
            e.target.value = ""
          }}
          className="hidden"
        />

        {/* ---- Info Text ---- */}
        <p className="mb-3 text-gray-800 font-medium text-lg">
          PDF, DOC, DOCX up to <span className="text-orange-600 font-semibold">5MB</span> each (max 5 files)
        </p>

        {/* ---- Feature Badges ---- */}
        <div className="flex flex-wrap gap-3 mb-5 justify-center">
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <CheckCircle size={16} /> Secure Processing
          </span>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <CheckCircle size={16} /> Auto-Delete
          </span>
          <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <CheckCircle size={16} /> AI Analysis
          </span>
        </div>

        {/* ---- Browse Button ---- */}
        <Button
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? "Processing..." : "📂 Browse Files"}
        </Button>
      </CardContent>
    </Card>

    {uploadedFiles.filter((f) => f.status === "completed").length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Processed Files</CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFiles
            .filter((f) => f.status === "completed")
            .map((file) => (
              <div key={file.id} className="p-4 border-b">
                <p className="font-semibold">{file.name}</p>
                <p>Company: {file.extractedData?.company}</p>
                <p>Position: {file.extractedData?.position}</p>
                <p>CTC: {formatCurrency(file.extractedData?.ctc)}</p>
                <p>
                  Monthly Take-Home:{" "}
                  {formatCurrency(file.extractedData?.monthlyTakeHome ?? 0)}
                </p>
              </div>
            ))}
        </CardContent>
      </Card>
    )}
  </div>
)

}
  