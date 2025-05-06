import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable"; // Import File type
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads
  },
};

// Define a larger file size limit (e.g., 1000MB or 1GiB)
const MAX_FILE_SIZE_BYTES = 1000 * 1024 * 1024; // 1000 MiB

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST"); // Indicate allowed method
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const uploadDir = path.join(process.cwd(), "public/uploads"); // Temporary upload directory
  const extractPath = path.join(process.cwd(), "public/unzipped"); // Extraction directory

  // --- Ensure directories exist ---
  try {
    await fs.promises.mkdir(uploadDir, { recursive: true });
    await fs.promises.mkdir(extractPath, { recursive: true });
  } catch (mkdirError) {
    console.error("Error creating directories:", mkdirError);
    return res.status(500).json({ message: "Server setup error: Could not create necessary directories." });
  }
  // --- End directory check ---

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxTotalFileSize: MAX_FILE_SIZE_BYTES, // Increase the total file size limit to 1000 MiB
    // Consider setting maxFileSize as well if needed, especially if you expect single large files
    maxFileSize: MAX_FILE_SIZE_BYTES,
  });

  form.parse(req, async (err: any, fields, files) => { // Using 'any' for err to access potential properties
    // --- Handle Formidable Parsing Errors ---
    if (err) {
      console.error("Error parsing the form:", err); // Log the full error object
      // Check specifically for the file size limit error
      if (err.code === 1009 || err.code === 1008) { // 1009: maxTotalFileSize, 1008: maxFileSize
          // Log the limits for debugging - access message if 'received' is undefined
          console.log(`Limit: ${MAX_FILE_SIZE_BYTES} bytes. Error details: ${err.message}`);
          return res.status(413).json({ // 413 Payload Too Large
            message: `File size exceeds the limit of ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MiB.`,
            code: err.code
          });
      }
      // Handle other potential parsing errors
      return res.status(400).json({ message: "Error processing uploaded file data.", details: err.message });
    }
    // --- End Formidable Error Handling ---

    // --- Validate File Upload ---
    const file = files.file?.[0] ?? files.file as formidable.File | undefined;

    if (!file) {
      return res.status(400).json({ message: "No file was uploaded." });
    }
    // --- End File Validation ---

    // --- Process the Uploaded File ---
    let uploadedFilePath = file.filepath;

    console.log("Uploaded file path:", uploadedFilePath);
    console.log("Uploaded file name:", file.originalFilename);

    try {
      const zip = new AdmZip(uploadedFilePath);
      zip.extractAllTo(extractPath, /*overwrite*/ true);
      console.log("Files extracted to:", extractPath);

      res.status(200).json({ message: "File uploaded and unzipped successfully.", filePath: extractPath });

    } catch (processingError) {
      console.error("Error processing the zip file:", processingError);
      if (processingError instanceof Error && processingError.message.includes("Invalid or unsupported zip format")) {
           return res.status(400).json({ message: "Invalid or unsupported zip file format." });
      }
      return res.status(500).json({ message: "Server error processing the uploaded file." });

    } finally {
      // --- Cleanup: Always attempt to remove the temporary uploaded file ---
      try {
        if (uploadedFilePath && await fs.promises.stat(uploadedFilePath)) {
             await fs.promises.unlink(uploadedFilePath);
             console.log(`Cleaned up temporary file: ${uploadedFilePath}`);
        }
      } catch (cleanupError: any) {
          if (cleanupError.code !== 'ENOENT') {
            console.error("Error cleaning up uploaded file:", cleanupError);
          }
      }
      // --- End Cleanup ---
    }
    // --- End File Processing ---
  });
}
