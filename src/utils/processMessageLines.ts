export interface ProcessedMessages {
  heading: string;
  savedDate: string;
  messagesByDate: Record<string, { author: string; messages: string[] }[]>;
}

export const processMessageLines = (
  lines: string[]
): ProcessedMessages => {
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
  const processedMessagesByDate = Object.fromEntries(
    Object.entries(messagesByDate).map(([date, entries]) => [
      date,
      entries
        .filter(({ author }) => author.trim() !== "Unknown") // Ignore entries with no author
        .map(({ author, messages }) => ({
          author,
          messages: Array.from(messages),
        })),
    ])
  );

  return { heading, savedDate, messagesByDate: processedMessagesByDate };
};