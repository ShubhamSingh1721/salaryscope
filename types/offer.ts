// types/offer.ts

export interface OfferType {
  id: string
  fileName: string
  company: string
  position: string
  location: string
  experience: number | string   // 👈 keep both safe for Gemini
  
  // core salary components
  ctc: number
  base: number
  hra: number
  pf: number


    baseAmount?: number
  // extra fields
  benefits?: number
  stocks?: number
  joiningBonus?: number
  bonus?: number
  gratuity?: number
  specialAllowance?: number
  medical?: number
  lta?: number

  // deductions + take-home
  taxDeduction?: number
  takeHome?: number
  monthlyTakeHome?: number
  inHandEstimate?: number   // 👈 added so dashboard won’t break

  // work-life balance
  workingDays?: number
  vacationDays?: number
  healthInsurance?: number
  retirementContribution?: number

  // metadata
  confidence?: number
  extractionMethod?: string
  warnings?: string[]
}
