export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class FileValidator {
  private static readonly ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]

  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly MIN_FILE_SIZE = 1024 // 1KB
  private static readonly MAX_FILES_PER_REQUEST = 5

  public static validateFile(file: File): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check file type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}. Only PDF, DOC, and DOCX files are supported.`)
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(
        `File size ${this.formatFileSize(file.size)} exceeds maximum limit of ${this.formatFileSize(this.MAX_FILE_SIZE)}.`,
      )
    }

    if (file.size < this.MIN_FILE_SIZE) {
      errors.push(
        `File size ${this.formatFileSize(file.size)} is too small. Minimum size is ${this.formatFileSize(this.MIN_FILE_SIZE)}.`,
      )
    }

    // Check filename
    if (!file.name || file.name.trim().length === 0) {
      errors.push("File must have a valid name.")
    }

    if (file.name.length > 255) {
      errors.push("Filename is too long (maximum 255 characters).")
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com"]
    if (suspiciousExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      errors.push("File type not allowed for security reasons.")
    }

    // Warnings for potentially problematic files
    if (file.name.includes(" ")) {
      warnings.push("Filename contains spaces which may cause processing issues.")
    }

    if (file.size > 2 * 1024 * 1024) {
      // 2MB
      warnings.push("Large file size may result in slower processing.")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  public static validateFileList(files: FileList | File[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const fileArray = Array.from(files)

    // Check file count
    if (fileArray.length === 0) {
      errors.push("No files selected.")
    }

    if (fileArray.length > this.MAX_FILES_PER_REQUEST) {
      errors.push(`Too many files selected. Maximum ${this.MAX_FILES_PER_REQUEST} files allowed per upload.`)
    }

    // Check for duplicate filenames
    const filenames = fileArray.map((f) => f.name.toLowerCase())
    const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index)
    if (duplicates.length > 0) {
      warnings.push(`Duplicate filenames detected: ${[...new Set(duplicates)].join(", ")}`)
    }

    // Validate each file
    fileArray.forEach((file, index) => {
      const fileValidation = this.validateFile(file)
      fileValidation.errors.forEach((error) => errors.push(`File ${index + 1} (${file.name}): ${error}`))
      fileValidation.warnings.forEach((warning) => warnings.push(`File ${index + 1} (${file.name}): ${warning}`))
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

export class SalaryDataValidator {
  public static validateExtractedData(data: any): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check required fields
    if (!data.ctc || data.ctc <= 0) {
      errors.push("CTC value is missing or invalid.")
    }

    if (!data.base || data.base <= 0) {
      errors.push("Base salary value is missing or invalid.")
    }

    // Validate salary ranges (reasonable bounds for Indian market)
    const MIN_SALARY = 100000 // 1 Lakh
    const MAX_SALARY = 50000000 // 5 Crores

    if (data.ctc && (data.ctc < MIN_SALARY || data.ctc > MAX_SALARY)) {
      warnings.push(`CTC of ₹${data.ctc.toLocaleString()} seems unusual. Please verify.`)
    }

    if (data.base && (data.base < MIN_SALARY || data.base > MAX_SALARY)) {
      warnings.push(`Base salary of ₹${data.base.toLocaleString()} seems unusual. Please verify.`)
    }

    // Validate component relationships
    if (data.ctc && data.base && data.base > data.ctc) {
      errors.push("Base salary cannot be greater than CTC.")
    }

    if (data.base && data.hra && data.hra > data.base) {
      warnings.push("HRA is unusually high compared to base salary.")
    }

    if (data.base && data.pf && data.pf > data.base * 0.15) {
      warnings.push("PF contribution seems unusually high.")
    }

    // Validate company name
    if (!data.company || data.company.trim().length === 0 || data.company === "Unknown Company") {
      warnings.push("Company name could not be extracted reliably.")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }
}
