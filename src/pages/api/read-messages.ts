import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    res.setHeader("Cache-Control", "no-store");

    const unzippedDir = path.join(process.cwd(), "public/unzipped");

    // Find the first directory inside the unzipped directory
    const directories = fs.readdirSync(unzippedDir).filter((file) => {
      const fullPath = path.join(unzippedDir, file);
      return fs.statSync(fullPath).isDirectory();
    });

    if (directories.length === 0) {
      return res.status(404).json({ message: "No chat directory found in the unzipped directory" });
    }

    const chatDir = path.join(unzippedDir, directories[0]);

    console.log("Chat directory:", chatDir);

    // Scan the chat directory for a text file
    const files = fs.readdirSync(chatDir);
    console.log("Files in chat directory:", files);

    const textFileName = files.find((file) => file.endsWith(".txt"));

    console.log("Text file name:", textFileName);

    if (!textFileName) {
      return res.status(404).json({ message: "No text file found in the chat directory" });
    }

    const textFilePath = path.join(chatDir, textFileName);

    const fileContent = fs.readFileSync(textFilePath, "utf-8");
    const lines = fileContent.split("\n").map((line) => line.trim()).filter(Boolean);

    console.log(lines)
    const messagesByDate: Record<string, Set<string>> = {};
    // const timestampRegex = /^\d{4}년 \d{1,2}월 \d{1,2}일/;
    const timestampRegex = /^\d{4}년 \d{1,2}월 \d{1,2}일( 오[전후] \d{1,2}:\d{2})?/;

    lines.forEach((line) => {
      console.log("Processing line:", line);
      const match = line.match(timestampRegex);
      if (match) {
        const timestamp = match[0];
        // const [date] = timestamp.split(" ");
        const date = timestamp;
        const message = line.replace(timestamp, "").trim();

        if (!messagesByDate[date]) {
          messagesByDate[date] = new Set();
        }

        messagesByDate[date].add(message);
      }
    });

    console.log("Messages by date:", messagesByDate);

    // Convert Set to Array for JSON serialization
    const result = Object.fromEntries(
      Object.entries(messagesByDate).map(([date, messages]) => [date, Array.from(messages)])
    );

    console.log("Result:", result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error reading chat messages:", error);
    return res.status(500).json({ message: "Error reading chat messages" });
  }
}