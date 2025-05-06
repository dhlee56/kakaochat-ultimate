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

    // Extract the first two lines as the heading and saved date
    const heading = lines[0] || ""; // First line as heading
    const savedDate = lines[1] || ""; // Second line as saved date
    const messageLines = lines.slice(2); // Remaining lines for processing messages

    console.log("Heading:", heading);
    console.log("Saved Date:", savedDate);
    console.log("Message Lines:", messageLines);

    const messagesByDate: Record<string, { author: string; messages: Set<string> }[]> = {};
    const timestampRegex = /^\d{4}년 \d{1,2}월 \d{1,2}일( 오[전후] \d{1,2}:\d{2})?/;
    const authorRegex = /^(.*?):/; // Regex to extract the author (e.g., "Author:")

    let currentDate: string | null = null;

    messageLines.forEach((line) => {
      console.log("Processing line:", line);
      const timestampMatch = line.match(timestampRegex);

      if (timestampMatch) {
        // Line contains a timestamp
        const timestamp = timestampMatch[0];
        const date = timestamp;
        const remainingLine = line.replace(timestamp, "").trim();

        const authorMatch = remainingLine.match(authorRegex);
        let author = authorMatch ? authorMatch[1].trim() : "Unknown";

        author = author.replace(/,/, "");

        const message = remainingLine.replace(authorRegex, "").trim();

        if (!messagesByDate[date]) {
          messagesByDate[date] = [];
        }

        // Add the message with the author to the current date's record
        messagesByDate[date].push({ author, messages: new Set([message]) });

        // Update the current date
        currentDate = date;
      } else if (currentDate) {
        // Line does not contain a timestamp, add it as a new message
        const newMessage = line.trim();

        if (newMessage) {
          // Add the new message to the last author's messages for the current date
          const lastEntry = messagesByDate[currentDate][messagesByDate[currentDate].length - 1];
          lastEntry.messages.add(newMessage);
        }
      }
    });

    console.log("Messages by date:", messagesByDate);

    // Convert Set to Array for JSON serialization
    const result = Object.fromEntries(
      Object.entries(messagesByDate).map(([date, entries]) => [
        date,
        entries.map(({ author, messages }) => ({
          author,
          messages: Array.from(messages),
        })),
      ])
    );

    console.log("Result:", result);
    return res.status(200).json({ heading, savedDate, messages: result });
  } catch (error) {
    console.error("Error reading chat messages:", error);
    return res.status(500).json({ message: "Error reading chat messages" });
  }
}