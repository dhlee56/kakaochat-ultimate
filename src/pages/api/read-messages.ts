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

    // Define a data type to hold message details
    type MessageDetails = {
      author: string;
      content: (string | { uri?: string; imageFileName?: string })[];
    };

    lines.forEach((line) => {
      console.log("Processing line:", line);
      const match = line.match(timestampRegex);
      if (match) {
        const timestamp = match[0].replace(",", ""); // Remove comma after timestamp
        const remainingText = line.replace(match[0], "").trim();

        // Extract author and message
        const [authorPart, ...messageParts] = remainingText.split(":").map((part) => part.trim());
        const author = authorPart; // Remove colon after author naturally during split
        const message = messageParts.join(":").trim();

        // Determine if the message contains URIs or image file names
        const uriRegex = /(https?:\/\/[^\s]+)/g;
        const imageRegex = /\.(jpg|jpeg|png|gif)$/i;

        const content: (string | { uri?: string; imageFileName?: string })[] = [];
        const uriMatches = message.match(uriRegex);
        const imageMatches = message.match(imageRegex);

        // Add the entire message as plain text
        content.push(message);

        // Add URIs if found
        if (uriMatches) {
          uriMatches.forEach((uri) => content.push({ uri }));
        }

        // Add image file names if found
        if (imageMatches) {
          imageMatches.forEach((imageFileName) => content.push({ imageFileName }));
        }

        const messageDetails: MessageDetails = {
          author,
          content,
        };

        const date = timestamp;

        if (!messagesByDate[date]) {
          messagesByDate[date] = new Set();
        }

        // Include the parsed message details in the result
        messagesByDate[date].add(JSON.stringify(messageDetails));
      }
    });

    // Convert Set to Array for JSON serialization
    const result = Object.fromEntries(
      Object.entries(messagesByDate).map(([date, messages]) => [
        date,
        Array.from(messages).map((msg) => JSON.parse(msg)),
      ])
    );

    console.log("Result:", result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error reading chat messages:", error);
    return res.status(500).json({ message: "Error reading chat messages" });
  }
}