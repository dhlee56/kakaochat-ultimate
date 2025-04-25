import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const uploadDir = path.join(process.cwd(), "public/uploads"); // Temporary upload directory
  const form = formidable({
    uploadDir,
    keepExtensions: true,
  });

  // Ensure the upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing the file:", err);
      return res.status(500).json({ message: "Error parsing the file" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const zip = new AdmZip(file.filepath);
      const extractPath = path.join(process.cwd(), "public/unzipped");

      // Ensure the extraction directory exists
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }

      // Extract the zip file
      zip.extractAllTo(extractPath, true);

      // Clean up the uploaded zip file
      fs.unlinkSync(file.filepath);

      return res.status(200).json({ message: "File uploaded and unzipped successfully" });
    } catch (error) {
      console.error("Error unzipping the file:", error);
      return res.status(500).json({ message: "Error unzipping the file" });
    }
  });
}