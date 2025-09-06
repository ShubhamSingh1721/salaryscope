
// import { NextResponse } from "next/server";
// import { writeFile, unlink } from "fs/promises";
// import { join } from "path";
// import pdfParse from "pdf-parse";
// import mammoth from "mammoth";
// import { SalaryExtractor } from "@/lib/salary-extractor";
// import { FileValidator, SalaryDataValidator } from "@/lib/validation";
// import { ErrorHandler, ErrorType, RateLimiter } from "@/lib/error-handler";
// import { connectToDatabase } from "@/lib/mongodb";
// import type { Offer } from "@/lib/models/Offer";
// import { tmpdir } from "os";
// import { NodeCanvasFactory } from "@/lib/NodeCanvasFactory";
// import type { RenderParameters } from "pdfjs-dist/types/src/display/api";


// import { ObjectId } from "mongodb";
// // import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf"; // 👈 OCR ke liye
// // @ts-ignore
// import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";



// import Tesseract from "tesseract.js";                   // 👈 OCR ke liye

// // ---------------- POST Route Without Auth ----------------
// export const POST = async (request: Request) => {
//   let tempPath: string | null = null;

//   try {
//     // Rate limiting
//     const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
//     const rateLimitResult = RateLimiter.checkRateLimit(clientIP);

//     if (!rateLimitResult.allowed) {
//       return NextResponse.json(
//         ErrorHandler.createError(
//           ErrorType.RATE_LIMIT_ERROR,
//           "Too many requests",
//           `Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetTime!).toLocaleTimeString()}`,
//           429,
//           true
//         ),
//         { status: 429 }
//       );
//     }

//     const formData = await request.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       const error = ErrorHandler.createError(
//         ErrorType.VALIDATION_ERROR,
//         "No file uploaded",
//         "Request must include a file",
//         400,
//         false
//       );
//       return NextResponse.json(error, { status: error.statusCode });
//     }

//     // Ignore old hardcoded test file paths
//     if (file.name.includes("05-versions-space.pdf") || file.name.startsWith("test/data")) {
//       return NextResponse.json({ error: "Hardcoded test file ignored" }, { status: 400 });
//     }

//     // File type validation
//     const validation = FileValidator.validateFile(file);
//     if (!validation.isValid) {
//       const error = ErrorHandler.handleValidationError(validation.errors);
//       return NextResponse.json(error, { status: error.statusCode });
//     }

//     // Create temporary file
//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     // Validate file content
//     if (!isValidFileContent(buffer, file.type)) {
//       const error = ErrorHandler.createError(
//         ErrorType.SECURITY_ERROR,
//         "File content does not match declared type",
//         "File may be corrupted or have incorrect extension",
//         400,
//         false
//       );
//       return NextResponse.json(error, { status: error.statusCode });
//     }

//     tempPath = join(
//       tmpdir(),
//       `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
//     );

//     await writeFile(tempPath, buffer);

//     // ---------------- Extract Text ----------------
//     let extractedText = "";
//     let parseMetadata: any = {};

//     if (file.type === "application/pdf") {
//       const pdfData = await pdfParse(buffer);
//       extractedText = cleanPdfText(pdfData.text);
//         console.log("📄 PDF Extracted Text:", extractedText.slice(0, 500));

//       parseMetadata = { pages: pdfData.numpages, info: pdfData.info, metadata: pdfData.metadata };

//       // 👇 Fallback to OCR if no proper text extracted
//       if (!extractedText || extractedText.trim().length < 50) {
//         console.log("⚠️ Falling back to OCR (scanned PDF detected)...");
//         extractedText = await extractTextWithOCR(buffer);
//         parseMetadata.ocrUsed = true;
//       }

//     } else if (file.type.includes("wordprocessingml") || file.type.includes("msword")) {
//       const result = await mammoth.extractRawText({ buffer });
//       extractedText = cleanDocxText(result.value);
//       console.log("📄 DOCX Extracted Text:", extractedText.slice(0, 500));

//       parseMetadata = { messages: result.messages, wordCount: extractedText.split(/\s+/).length };
//     }
//   if (!extractedText || extractedText.trim().length < 50) {
//       throw ErrorHandler.createError(
//         ErrorType.PARSING_ERROR,
//         "Insufficient text content",
//         "Document appears empty or unreadable",
//         400,
//         false
//       );
//     }

//     // ---------------- Salary Extraction ----------------
//     console.log("📊 Final Cleaned Text (Before Extraction):", extractedText.slice(0, 500));

//     const extractionResult = SalaryExtractor.extractSalaryComponents(extractedText, file.name);
//     console.log("🟢 Extractor Output:", JSON.stringify(extractionResult, null, 2));
//     console.log("🔎 Debug Check:", extractionResult);


//     const dataValidation = SalaryDataValidator.validateExtractedData({
//       ctc: extractionResult.ctc.value,
//       base: extractionResult.base.value,
//       company: extractionResult.company.name,
//       hra: extractionResult.hra.value,
//       pf: extractionResult.pf.value,
//     });

//     const allWarnings = [...extractionResult.warnings, ...validation.warnings, ...dataValidation.warnings];
//     if (!dataValidation.isValid) {
//       allWarnings.push(...dataValidation.errors.map((err) => `Data validation: ${err}`));
//     }

//     // ---------------- Save to DB ----------------
//     const { db } = await connectToDatabase();
//     const offerData: Omit<Offer, "_id"> = {
//       userId: "anonymous", // since auth removed
//       company: extractionResult.company.name,
//       position: extractionResult.position?.title,
//       ctc: extractionResult.ctc.value,
//       base: extractionResult.base.value,
//       bonus: extractionResult.bonus.value,
//       pf: extractionResult.pf.value,
//       medical: extractionResult.medical.value,
//       hra: extractionResult.hra.value,
//       lta: extractionResult.lta.value,
//       specialAllowance: extractionResult.specialAllowance.value,
//       inHandEst: extractionResult.inHandEstimate,
//       taxDeduction: extractionResult.ctc.value - extractionResult.inHandEstimate,
//       confidence: extractionResult.overallConfidence,
//       extractionMethod: extractionResult.extractionMethod.join(", "),
//       warnings: allWarnings,
//       uploadDate: new Date(),
//       fileName: file.name,
//       fileType: file.type,
//     };

//     const result = await db.collection("offers").insertOne(offerData);
//     const savedOffer = { ...offerData, _id: result.insertedId.toHexString() };

//     await unlink(tempPath).catch(() => console.warn(`Failed to delete temp file: ${tempPath}`));
//     tempPath = null;

//        return NextResponse.json({
//       success: true,
//       data: {
//         id: savedOffer._id,
//         company: extractionResult.company?.name || "Unknown",
//         position: extractionResult.position?.title || "Not specified",

//         // ✅ numbers flattened
//         ctc: extractionResult.ctc?.value || 0,
//         base: extractionResult.base?.value || 0,
//        baseAmount: extractionResult.base?.value || 0,
//         hra: extractionResult.hra?.value || 0,
//         pf: extractionResult.pf?.value || 0,
//         bonus: extractionResult.bonus?.value || 0,
//         medical: extractionResult.medical?.value || 0,
//         lta: extractionResult.lta?.value || 0,
//         gratuity: extractionResult.gratuity?.value || 0,
//         specialAllowance: extractionResult.specialAllowance?.value || 0,

//         inHandEstimate: extractionResult.inHandEstimate || 0,
//         taxDeduction: (extractionResult.ctc?.value || 0) - (extractionResult.inHandEstimate || 0),
//         confidence: extractionResult.overallConfidence || 0,
//         extractionMethod: extractionResult.extractionMethod?.join(", ") || "",

//         warnings: allWarnings,
//         parseMetadata,
//         uploadDate: savedOffer.uploadDate,
//         fileName: file.name,
//         fileType: file.type,
//       },
//       filename: file.name,
//     });

//   } catch (error) {
//     console.error("Upload error:", error);
//     const handledError = ErrorHandler.handleFileProcessingError(error);
//     return NextResponse.json(handledError, { status: handledError.statusCode });
//   } finally {
//     if (tempPath) {
//       try {
//         await unlink(tempPath);
//       } catch {}
//     }
//   }
// };

// // ---------------- Helper Functions ----------------
// function isValidFileContent(buffer: Buffer, mimeType: string): boolean {
//   if (buffer.length < 4) return false;
//   const header = buffer.subarray(0, 4);
//   switch (mimeType) {
//     case "application/pdf":
//       return buffer.subarray(0, 4).toString() === "%PDF";
//     case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
//       return header[0] === 0x50 && header[1] === 0x4b;
//     case "application/msword":
//       return header[0] === 0xd0 && header[1] === 0xcf;
//     default:
//       return true;
//   }
// }

// function cleanPdfText(text: string): string {
//   return text
//     .replace(/\s+/g, " ")
//     .replace(/\n\s*\n/g, "\n")
//     .replace(/[^\x20-\x7E\n]/g, " ")
//     .replace(/\b(\d+),(\d{3})\b/g, "$1$2")
//     .replace(/Rs\.?\s*(\d)/g, "Rs $1")
//     .replace(/₹\s*(\d)/g, "₹$1")
//     .trim();
// }

// function cleanDocxText(text: string): string {
//   return text
//     .replace(/\s+/g, " ")
//     .replace(/\n\s*\n/g, "\n")
//     .replace(/\t+/g, " ")
//     .replace(/Rs\.?\s*(\d)/g, "Rs $1")
//     .replace(/₹\s*(\d)/g, "₹$1")
//     .trim();
// }

// // ---------------- OCR Helper ----------------
// async function extractTextWithOCR(buffer: Buffer): Promise<string> {
//   const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
//   let fullText = "";

//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const viewport = page.getViewport({ scale: 2 });
//     const canvasFactory = new NodeCanvasFactory();

//     const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
//   const renderContext: RenderParameters = {
//   canvasContext: canvasAndContext.context as any,
//   viewport,
// };

// await page.render(renderContext).promise;


//     const image = canvasAndContext.canvas.toBuffer();
//     const { data: { text } } = await Tesseract.recognize(image, "eng");
//     fullText += text + "\n";
//   }

//   return fullText.replace(/\s+/g, " ").trim();
// }










import { NextResponse } from "next/server"
import { writeFile, unlink } from "fs/promises"
import { join } from "path"
import pdfParse from "pdf-parse"
import { connectToDatabase } from "@/lib/mongodb"
import type { Offer } from "@/lib/models/Offer"
import { tmpdir } from "os"

// 👇 Gemini SDK import
import { GoogleGenerativeAI } from "@google/generative-ai"

// ---------------- POST Route ----------------
export const POST = async (request: Request) => {
  let tempPath: string | null = null

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Create temp file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    tempPath = join(
      tmpdir(),
      `upload_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    )
    await writeFile(tempPath, buffer)

    // ---------------- Extract PDF Text ----------------
    let extractedText = ""
    if (file.type === "application/pdf") {
      const pdfData = await pdfParse(buffer)
      extractedText = cleanPdfText(pdfData.text)
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: "PDF content unreadable or empty" },
        { status: 400 }
      )
    }

    // ---------------- Call Gemini ----------------
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    // const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

 const prompt = `
You are an AI assistant that extracts structured data from offer letters.
Return the result ONLY in valid JSON format, with these fields:

{
  "company": string,
  "position": string,
  "location": string,
  "experience": number,
  "ctc": number,
  "baseAmount": number,
  "hra": number,
  "bonus": number,
  "pf": number,
  "medical": number,
  "lta": number,
  "specialAllowance": number,
  "benefits": number,
  "stocks": number,
  "joiningBonus": number,
  "takeHome": number,
  "monthlyTakeHome": number,
  "monthlyBaseAmount": number,
  "monthlyHRA": number,
  "monthlyBonus": number,
  "monthlySpecialAllowance": number,
  "workingDays": number,
  "vacationDays": number,
  "healthInsurance": number,
  "retirementContribution": number
}

Rules:
If a field is missing in PDF, set it to 0 (for numbers) or "Unknown" (for text).

Ensure numbers are returned as plain integers (no commas, no text).

Always calculate takeHome using this exact logic (ignore explicit take-home if present in PDF):

Take Annual Fixed Pay from PDF.

Subtract standard deductions: EPF (12% of basic), Professional Tax (fixed 2,400 or per state), and Income Tax (New Tax Regime slabs).

Add any allowances (hra, bonus, specialAllowance, other allowances) from PDF.

Result = Annual takeHome.

Calculate monthly amounts by dividing annual amounts by 12 and rounding to nearest integer:

monthlyTakeHome = takeHome / 12

monthlyBaseAmount = baseAmount / 12

monthlyHRA = hra / 12

monthlyBonus = bonus / 12

monthlySpecialAllowance = specialAllowance / 12

Provide both annual and monthly values for all relevant components.

Round all calculated values to nearest integer.

Extract data ONLY from the PDF text provided; do not invent values unless default (0 or "Unknown").

PDF Content:
${extractedText}
`
 


    const result = await model.generateContent(prompt)
    const response = await result.response
    let text = response.text()

    // ---------------- Clean code block wrappers ----------------
    text = text.replace(/```(?:json)?\s*([\s\S]*?)```/, '$1').trim()

    // ---------------- Parse JSON ----------------
    let parsedData: any
    try {
      parsedData = JSON.parse(text)
    } catch (err) {
      console.error("❌ Gemini returned invalid JSON:", text)
      return NextResponse.json({ error: "AI extraction failed" }, { status: 500 })
    }

    // ---------------- Save to DB ----------------
    const { db } = await connectToDatabase()
    const offerData: Omit<Offer, "_id"> = {
      userId: "anonymous",
      ...parsedData,
      uploadDate: new Date(),
      fileName: file.name,
      fileType: file.type,
    }

    const resultDB = await db.collection("offers").insertOne(offerData)
    const savedOffer = { ...offerData, _id: resultDB.insertedId.toHexString() }

    // Cleanup temp file
    await unlink(tempPath).catch(() => {})
    tempPath = null

    return NextResponse.json({ success: true, data: savedOffer })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  } finally {
    if (tempPath) {
      try {
        await unlink(tempPath)
      } catch {}
    }
  }
}

// ---------------- Helper ----------------
function cleanPdfText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .trim()
}
