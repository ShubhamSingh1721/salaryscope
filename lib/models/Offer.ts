export interface Offer {
  _id?: string
  userId: string
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
  taxDeduction?: number
  confidence?: number
  extractionMethod?: string
  warnings?: string[]
  uploadDate: Date
  fileName?: string
  fileType?: string
}

export const OfferSchema = {
  userId: { type: "string", required: true },
  company: { type: "string", required: true },
  position: { type: "string", optional: true },
  ctc: { type: "number", required: true },
  base: { type: "number", required: true },
  bonus: { type: "number", optional: true },
  pf: { type: "number", optional: true },
  medical: { type: "number", optional: true },
  hra: { type: "number", optional: true },
  lta: { type: "number", optional: true },
  specialAllowance: { type: "number", optional: true },
  inHandEst: { type: "number", required: true },
  taxDeduction: { type: "number", optional: true },
  confidence: { type: "number", optional: true },
  extractionMethod: { type: "string", optional: true },
  warnings: { type: "array", optional: true },
  uploadDate: { type: "date", default: () => new Date() },
  fileName: { type: "string", optional: true },
  fileType: { type: "string", optional: true },
}
