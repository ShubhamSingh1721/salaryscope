interface SalaryComponent {
  value: number
  confidence: number
  source: string
  context?: string
}

interface ExtractionResult {
  ctc: SalaryComponent
  base: SalaryComponent
  bonus: SalaryComponent
  pf: SalaryComponent
  gratuity: SalaryComponent
  hra: SalaryComponent
  medical: SalaryComponent
  lta: SalaryComponent
  specialAllowance: SalaryComponent
  company: {
    name: string
    confidence: number
  }
  position?: {
    title: string
    confidence: number
  }
  inHandEstimate: number
  overallConfidence: number
  extractionMethod: string[]
  warnings: string[]
}

export class SalaryExtractor {
  private static readonly CURRENCY_PATTERNS = [/(?:rs\.?|inr|₹|rupees?)\s*/gi, /(?:rs\.?\s*|inr\s*|₹\s*)/gi]

  private static readonly NUMBER_PATTERNS = [
    // Standard number formats
    /(\d{1,2}(?:,\d{2,3})*(?:\.\d{2})?)/g,
    // Lakhs format
    /(\d+(?:\.\d+)?\s*(?:lakhs?|lacs?))/gi,
    // Crores format
    /(\d+(?:\.\d+)?\s*crores?)/gi,
    // Written numbers
    /(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|crore)/gi,
  ]

  private static readonly SALARY_PATTERNS = {
    ctc: {
      primary: [
        /(?:ctc|cost\s*to\s*company|total\s*compensation|annual\s*ctc|gross\s*ctc)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:total\s*package|annual\s*package|yearly\s*package)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:gross\s*annual\s*salary|annual\s*gross)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      secondary: [
        /(?:total\s*annual\s*compensation|tac)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:annual\s*salary)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      contextual: [/(?:your\s*ctc|ctc\s*will\s*be|ctc\s*is)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi],
    },
    base: {
      primary: [
        /(?:basic\s*salary|base\s*salary|basic\s*pay|fixed\s*salary)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:monthly\s*basic|basic\s*monthly)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      secondary: [
        /(?:fixed\s*component|base\s*component)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:basic\s*component)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
    },
    bonus: {
      primary: [
        /(?:bonus|variable\s*pay|performance\s*bonus|annual\s*bonus)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:incentive|performance\s*incentive)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      secondary: [
        /(?:variable\s*component|performance\s*component)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
        /(?:annual\s*incentive)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
    },
    pf: {
      primary: [
        /(?:pf|provident\s*fund|epf|employee\s*provident\s*fund)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      secondary: [
        /(?:pf\s*contribution|provident\s*fund\s*contribution)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
    },
    hra: {
      primary: [
        /(?:hra|house\s*rent\s*allowance|housing\s*allowance)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      secondary: [
        /(?:rent\s*allowance|accommodation\s*allowance)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
    },
    medical: {
      primary: [
        /(?:medical\s*allowance|health\s*insurance|medical\s*insurance)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
      secondary: [/(?:health\s*allowance|medical\s*benefit)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi],
    },
    lta: {
      primary: [/(?:lta|leave\s*travel\s*allowance)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi],
    },
    gratuity: {
      primary: [/(?:gratuity)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi],
    },
    specialAllowance: {
      primary: [
        /(?:special\s*allowance|other\s*allowance|miscellaneous\s*allowance)[:\s-]*(?:rs\.?|inr|₹)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
      ],
    },
  }

  private static readonly COMPANY_PATTERNS = [
    // Direct company mentions
    /(?:company|organization|employer)[:\s]*([a-zA-Z\s&.,-]+?)(?:\n|$|limited|ltd|pvt|private)/i,
    // Company with legal entity
    /([a-zA-Z\s&.,-]+?)\s*(?:private\s*limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|corp\.?|llp|llc)/i,
    // From/by patterns
    /(?:from|by)\s+([a-zA-Z\s&.,-]+?)(?:\s|$|,|\n)/i,
    // Offer letter headers
    /(?:offer\s*letter|appointment\s*letter)[\s\S]*?(?:from|by)\s+([a-zA-Z\s&.,-]+)/i,
    // Letterhead patterns
    /^([A-Z][a-zA-Z\s&.,-]+?)(?:\n|\s{2,})/m,
  ]

  private static readonly POSITION_PATTERNS = [
    /(?:position|role|designation|job\s*title)[:\s]*([a-zA-Z\s]+?)(?:\n|$|,)/i,
    /(?:as\s*(?:a|an)?\s*)([a-zA-Z\s]+?)(?:\s*at|\s*in|\s*with)/i,
    /(?:software\s*engineer|developer|analyst|manager|consultant|associate|specialist)/gi,
  ]

  public static extractSalaryComponents(text: string, filename?: string): ExtractionResult {
    const extractor = new SalaryExtractor()
    return extractor.extract(text, filename)
  }

  private extract(text: string, filename?: string): ExtractionResult {
    const cleanedText = this.preprocessText(text)
    const extractionMethods: string[] = []
    const warnings: string[] = []

    // Extract company information
    const company = this.extractCompany(cleanedText)

    // Extract position information
    const position = this.extractPosition(cleanedText)

    // Extract salary components using multiple strategies
    const components = this.extractAllComponents(cleanedText, extractionMethods, warnings)

    // Validate and cross-reference components
    this.validateComponents(components, warnings)

    // Relaxed validation using SalaryDataValidator
const validatorResult = SalaryDataValidator.validateExtractedData(components);
warnings.push(...validatorResult.warnings);


    // Calculate in-hand estimate
    const inHandEstimate = this.calculateInHandSalary(components)

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(components, company, position)

    return {
      ...components,
      company,
      position,
      inHandEstimate,
      overallConfidence,
      extractionMethod: extractionMethods,
      warnings,
    }
  }

  private preprocessText(text: string): string {
    return (
      text
        // Normalize whitespace
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        // Fix common OCR issues
        .replace(/[^\x20-\x7E\n]/g, " ")
        // Normalize currency formats
        .replace(/Rs\.?\s*(\d)/g, "Rs $1")
        .replace(/₹\s*(\d)/g, "₹$1")
        .replace(/INR\s*(\d)/g, "INR $1")
        // Fix number formatting
        .replace(/(\d+),(\d{3})/g, "$1$2")
        .trim()
    )
  }

  private extractAllComponents(
    text: string,
    methods: string[],
    warnings: string[],
  ): Omit<
    ExtractionResult,
    "company" | "position" | "inHandEstimate" | "overallConfidence" | "extractionMethod" | "warnings"
  > {
    const components: any = {}

    // Strategy 1: Direct pattern matching
    methods.push("pattern-matching")
    for (const [componentName, patterns] of Object.entries(SalaryExtractor.SALARY_PATTERNS)) {
      components[componentName] = this.extractComponent(text, patterns, componentName)
    }

    // Strategy 2: Table/structured data extraction
    const tableData = this.extractFromTables(text)  
    if (tableData.found) {
      methods.push("table-extraction")
      Object.assign(components, tableData.components)
    }

    // Strategy 3: Contextual extraction
    const contextualData = this.extractContextual(text)
    if (contextualData.found) {
      methods.push("contextual-extraction")
      this.mergeComponents(components, contextualData.components)
    }

    // Strategy 4: Fallback estimation
    if (this.needsFallback(components)) {
      methods.push("fallback-estimation")
      this.applyFallbackLogic(components, text, warnings)
    }

    return components
  }

  private extractComponent(text: string, patterns: any, componentName: string): SalaryComponent {
    let bestMatch: SalaryComponent = { value: 0, confidence: 0, source: "none" }

    // Try primary patterns first
    for (const pattern of patterns.primary || []) {
      const matches = [...text.matchAll(pattern)]
      for (const match of matches) {
        const value = this.parseNumber(match[1])
        if (value > 0) {
          const confidence = this.calculatePatternConfidence(match, "primary", componentName)
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              value,
              confidence,
              source: "primary-pattern",
              context: match[0].substring(0, 50),
            }
          }
        }
      }
    }

    // Try secondary patterns if primary didn't yield good results
    if (bestMatch.confidence < 70 && patterns.secondary) {
      for (const pattern of patterns.secondary) {
        const matches = [...text.matchAll(pattern)]
        for (const match of matches) {
          const value = this.parseNumber(match[1])
          if (value > 0) {
            const confidence = this.calculatePatternConfidence(match, "secondary", componentName)
            if (confidence > bestMatch.confidence) {
              bestMatch = {
                value,
                confidence,
                source: "secondary-pattern",
                context: match[0].substring(0, 50),
              }
            }
          }
        }
      }
    }

    // Try contextual patterns
   // --- BASE SALARY FIX ---
if (componentName === "base") {
  const basePattern = /(?:Base|Basic Salary)\s*[:\-]?\s*([\d,]+)/i;
  const baseMatch = text.match(basePattern);
  if (baseMatch) {
    bestMatch = {
      value: parseInt(baseMatch[1].replace(/,/g, "")),
      confidence: 90,
      source: "primary-pattern",
      context: baseMatch[0].substring(0, 50),
    };
  }
}
// --- END BASE SALARY FIX ---

// --- SPECIAL ALLOWANCE FIX ---
if (componentName === "specialAllowance") {
  const saPattern = /Special Allowance\s*[:\-]?\s*([\d,]+)/i;
  const saMatch = text.match(saPattern);
  if (saMatch) {
    bestMatch = {
      value: parseInt(saMatch[1].replace(/,/g, "")),
      confidence: 90,
      source: "primary-pattern",
      context: saMatch[0].substring(0, 50),
    }
  }
}
// --- END SPECIAL ALLOWANCE FIX ---


    return bestMatch
  }

  private extractFromTables(text: string): { found: boolean; components: any } {
    // Look for tabular data patterns
    const tablePatterns = [
      // Pipe-separated tables
      /\|[^|]+\|[^|]+\|/g,
      // Tab-separated data
      /\t[^\t]+\t[^\t]+/g,
      // Colon-separated key-value pairs
      /^[^:\n]+:[^:\n]+$/gm,
    ]

    const components: any = {}
    let found = false

    for (const pattern of tablePatterns) {
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 2) {
        // At least 3 rows suggest a table
        found = true
        // Process table data
        for (const match of matches) {
          const row = match[0]
          this.processTableRow(row, components)
        }
      }
    }

    return { found, components }
  }
private processTableRow(row: string, components: any): void {
  const parts = row.split(/[|\t:]/).map((p) => p.trim())
  if (parts.length >= 2) {
    const key = parts[0].toLowerCase()
    const value = parts[1]

    // ✅ Manual mapping for table rows
    let componentName: string | null = null
    if (key.includes("basic")) componentName = "base"
    else if (key.includes("hra") || key.includes("house rent")) componentName = "hra"
    else if (key.includes("conveyance")) componentName = "specialAllowance"
    else if (key.includes("special")) componentName = "specialAllowance"
    else if (key.includes("re-allocation") || key.includes("relocation")) componentName = "specialAllowance"
    else if (key.includes("bonus")) componentName = "bonus"
    else if (key.includes("benefit") || key.includes("perks") || key.includes("allowance")) componentName = "benefits"
    else if (key.includes("pf") || key.includes("provident")) componentName = "pf"
    else if (key.includes("medical")) componentName = "medical"
    else if (key.includes("lta") || key.includes("leave travel")) componentName = "lta"
    else if (key.includes("gratuity")) componentName = "gratuity"
    else if (key.includes("stock") || key.includes("esop")) componentName = "stocks"
    else if (key.includes("joining bonus") || key.includes("sign-on")) componentName = "joiningBonus"
    else if (key.includes("total cost") || key.includes("ctc")) componentName = "ctc"
    else if (key.includes("annual fixed")) componentName = "ctc" // backup mapping

    if (componentName) {
      const numValue = this.parseNumber(value)
      if (numValue > 0) {
        components[componentName] = {
          value: numValue,
          confidence: 80,
          source: "table-extraction",
          context: row.substring(0, 50),
        }
      }
      return // exit once mapped
    }

    // ❌ fallback: old regex based matching (keep as backup)
    for (const [componentName2, patterns] of Object.entries(SalaryExtractor.SALARY_PATTERNS)) {
      const primaryPattern = patterns.primary?.[0]
      if (primaryPattern) {
        const keyPattern = primaryPattern.source.split("[")[0].replace(/\(\?:/g, "").replace(/\|/g, "|")
        if (key.includes(keyPattern.split("|")[0])) {
          const numValue = this.parseNumber(value)
          if (numValue > 0) {
            if (!components[componentName2] || components[componentName2].confidence < 60) {
              components[componentName2] = {
                value: numValue,
                confidence: 60,
                source: "table-extraction",
                context: row.substring(0, 50),
              }
            }
          }
        }
      }
    }
  }
}

  private extractContextual(text: string): { found: boolean; components: any } {
    const components: any = {}
    let found = false

    // Look for breakdown sections
    const breakdownPatterns = [
      /(?:salary\s*breakdown|compensation\s*breakdown|ctc\s*breakdown)/i,
      /(?:components|details|structure)/i,
    ]

    for (const pattern of breakdownPatterns) {
      const match = text.match(pattern)
      if (match) {
        found = true
        const startIndex = match.index || 0
        const section = text.substring(startIndex, startIndex + 1000)

        // Extract numbers and their contexts from this section
        const numberMatches = [...section.matchAll(/(\d+(?:,\d{3})*(?:\.\d{2})?)/g)]
        for (const numMatch of numberMatches) {
          const value = this.parseNumber(numMatch[1])
          const context = section.substring(Math.max(0, numMatch.index! - 50), numMatch.index! + 50)

          // Try to classify this number
          const classification = this.classifyNumber(context, value)
          if (classification && (!components[classification] || components[classification].confidence < 50)) {
            components[classification] = {
              value,
              confidence: 50,
              source: "contextual-extraction",
              context: context.trim(),
            }
          }
        }
      }
    }

    return { found, components }
  }

  private classifyNumber(context: string, value: number): string | null {
    const lowerContext = context.toLowerCase()

    if (lowerContext.includes("ctc") || lowerContext.includes("total")) return "ctc"
    if (lowerContext.includes("basic") || lowerContext.includes("base")) return "base"
    if (lowerContext.includes("bonus") || lowerContext.includes("variable")) return "bonus"
    if (lowerContext.includes("hra") || lowerContext.includes("house")) return "hra"
    if (lowerContext.includes("pf") || lowerContext.includes("provident")) return "pf"
    if (lowerContext.includes("medical") || lowerContext.includes("health")) return "medical"
    if (lowerContext.includes("lta") || lowerContext.includes("travel")) return "lta"
    if (lowerContext.includes("gratuity")) return "gratuity"
    // if (lowerContext.includes("special") || lowerContext.includes("other")) return "specialAllowance"

    return null
  }

  private parseNumber(numStr: string): number {
    if (!numStr) return 0

    // Handle lakhs and crores
    const lowerStr = numStr.toLowerCase()
    if (lowerStr.includes("lakh") || lowerStr.includes("lac")) {
      const num = Number.parseFloat(numStr.replace(/[^\d.]/g, ""))
      return Math.round(num * 100000)
    }
    if (lowerStr.includes("crore")) {
      const num = Number.parseFloat(numStr.replace(/[^\d.]/g, ""))
      return Math.round(num * 10000000)
    }

    // Handle regular numbers
    return Number.parseInt(numStr.replace(/[^\d]/g, "")) || 0
  }

  private calculatePatternConfidence(match: RegExpMatchArray, patternType: string, componentName: string): number {
    let confidence = 0

    // Base confidence by pattern type
    switch (patternType) {
      case "primary":
        confidence = 80
        break
      case "secondary":
        confidence = 60
        break
      case "contextual":
        confidence = 40
        break
      default:
        confidence = 20
    }

    // Adjust based on context quality
    const context = match[0].toLowerCase()
    if (context.includes(componentName)) confidence += 10
    if (context.includes("annual") || context.includes("yearly")) confidence += 5
    if (context.includes("monthly")) confidence -= 5 // Monthly values need conversion

    return Math.min(confidence, 100)
  }

  private extractCompany(text: string): { name: string; confidence: number } {
   const companyPattern = /in\s+([a-zA-Z\s]+(?:Private Ltd|Pvt Ltd|LLP))/i;
const companyMatch = text.match(companyPattern);
if (companyMatch && companyMatch[1]) {
  const name = companyMatch[1].trim();
  return { name, confidence: 100 };
}
// fallback to old patterns if needed


    return { name: "Unknown Company", confidence: 0 }
  }

  private extractPosition(text: string): { title: string; confidence: number } | undefined {
    const posPattern = /position as\s+([A-Za-z\s\-]+)/i;
const posMatch = text.match(posPattern);
if (posMatch && posMatch[1]) {
  const title = posMatch[1].trim();
  return { title, confidence: 100 };
}
// fallback to old patterns if needed
// for (const pattern of SalaryExtractor.POSITION_PATTERNS) {
//   ...
// }

    return undefined
  }

  private calculateCompanyConfidence(name: string, text: string): number {
    let confidence = 50

    // Check if it appears multiple times
    const occurrences = (text.match(new RegExp(name, "gi")) || []).length
    confidence += Math.min(occurrences * 10, 30)

    // Check if it has common company suffixes
    if (/(?:ltd|limited|inc|corp|llp|pvt)\.?$/i.test(name)) confidence += 20

    // Check if it's in a professional context
    if (text.toLowerCase().includes("offer letter") || text.toLowerCase().includes("appointment")) confidence += 10

    return Math.min(confidence, 100)
  }

  private calculatePositionConfidence(title: string, text: string): number {
    let confidence = 40

    // Check against common job titles
    const commonTitles = ["engineer", "developer", "analyst", "manager", "consultant", "associate", "specialist"]
    if (commonTitles.some((t) => title.toLowerCase().includes(t))) confidence += 30

    // Check if it appears in context
    if (text.toLowerCase().includes("position") || text.toLowerCase().includes("role")) confidence += 20

    return Math.min(confidence, 100)
  }

  private needsFallback(components: any): boolean {
    return !components.ctc?.value && !components.base?.value
  }

  private applyFallbackLogic(components: any, text: string, warnings: string[]): void {
    warnings.push("Applied fallback estimation due to insufficient data extraction")

    // Try to find any large numbers that could be salaries
    const largeNumbers = [...text.matchAll(/(?:rs\.?|inr|₹)?\s*(\d{1,2}(?:,\d{2,3})*(?:\.\d{2})?)/gi)]
      .map((match) => this.parseNumber(match[1]))
      .filter((num) => num >= 100000 && num <= 50000000)
      .sort((a, b) => b - a)

    if (largeNumbers.length > 0) {
      if (!components.ctc?.value) {
        components.ctc = {
          value: largeNumbers[0],
          confidence: 30,
          source: "fallback-estimation",
          context: "Largest number found in document",
        }
      }

      if (!components.base?.value && components.ctc?.value) {
        components.base = {
          value: Math.round(components.ctc.value * 0.6),
          confidence: 25,
          source: "fallback-estimation",
          context: "Estimated as 60% of CTC",
        }
      }
    }
  }

  private mergeComponents(target: any, source: any): void {
    for (const [key, value] of Object.entries(source)) {
      if (!target[key] || target[key].confidence < (value as any).confidence) {
        target[key] = value
      }
    }
  }

  private validateComponents(components: any, warnings: string[]): void {
    // Check if CTC is sum of components
    const componentSum =
      (components.base?.value || 0) +
      (components.bonus?.value || 0) +
      (components.pf?.value || 0) +
      (components.hra?.value || 0) +
      (components.medical?.value || 0) +
      (components.lta?.value || 0) +
      (components.gratuity?.value || 0) +
      (components.specialAllowance?.value || 0)

    if (components.ctc?.value && componentSum > 0) {
      const difference = Math.abs(components.ctc.value - componentSum)
      const percentDiff = (difference / components.ctc.value) * 100

      if (percentDiff > 20) {
        warnings.push(`CTC and component sum differ by ${percentDiff.toFixed(1)}%`)
      }
    }

    // Validate reasonable ranges
    if (components.base?.value && components.ctc?.value) {
      const basePercentage = (components.base.value / components.ctc.value) * 100
      if (basePercentage < 30 || basePercentage > 80) {
        warnings.push(`Base salary is ${basePercentage.toFixed(1)}% of CTC, which seems unusual`)
      }
    }
  }

  private calculateInHandSalary(components: any): number {
   const base = components.base?.value || 0
const hra = components.hra?.value || 0
const bonus = components.bonus?.value || 0
const pf = components.pf?.value || 0
const specialAllowance = components.specialAllowance?.value || 0

const taxableIncome = base + hra + bonus + specialAllowance
const tax = this.calculateTax(taxableIncome)
const professionalTax = 2400

return Math.max(Math.round((taxableIncome - tax - pf - professionalTax) / 12), 0)

  }

  private calculateTax(income: number): number {
    // FY 2023-24 tax slabs (new regime)
    if (income <= 300000) return 0
    if (income <= 600000) return (income - 300000) * 0.05
    if (income <= 900000) return 15000 + (income - 600000) * 0.1
    if (income <= 1200000) return 45000 + (income - 900000) * 0.15
    if (income <= 1500000) return 90000 + (income - 1200000) * 0.2
    return 150000 + (income - 1500000) * 0.3
  }

  private calculateOverallConfidence(components: any, company: any, position: any): number {
    let totalConfidence = 0
    let componentCount = 0

    // Weight components by importance
    const weights = {
      ctc: 0.3,
      base: 0.25,
      bonus: 0.1,
      hra: 0.1,
      pf: 0.1,
      medical: 0.05,
      lta: 0.05,
      gratuity: 0.05,
    }

    for (const [key, weight] of Object.entries(weights)) {
      if (components[key]?.confidence > 0) {
        totalConfidence += components[key].confidence * weight
        componentCount += weight
      }
    }

    // Add company and position confidence
    if (company.confidence > 0) {
      totalConfidence += company.confidence * 0.1
      componentCount += 0.1
    }

    if (position?.confidence > 0) {
      totalConfidence += position.confidence * 0.05
      componentCount += 0.05
    }

    return componentCount > 0 ? Math.round(totalConfidence / componentCount) : 0
  }
}
// all remains same above
export class SalaryDataValidator {
  static validateExtractedData(data: any) {
    const warnings: string[] = [];
    const errors: string[] = [];
    let isValid = true;

    if (data.base === 0 || data.base === null) {
      warnings.push("Base salary is 0 or missing, dashboard will show partial data");
    }

    const sumComponents = (data.base || 0) + (data.hra || 0) + (data.pf || 0) + (data.bonus || 0);
    if (data.ctc && Math.abs(sumComponents - data.ctc) / data.ctc > 0.3) {
      warnings.push("CTC and component sum differ significantly");
    }

    return { warnings, errors, isValid: true };
  }
}

