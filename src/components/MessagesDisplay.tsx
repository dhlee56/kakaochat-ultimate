import groupMessages from "@/utils/groupMessages";
import React from "react";

interface MessagesDisplayProps {
  heading: string;
  savedDate: string;
  messages: Record<
    string,
    { author: string; messages: string[] }[]
  >; // Updated structure to match API response
  unzipFilePath: string; // Path to the unzipped directory
  chatFileName: string; // Name of the chat directory
}

const MessagesDisplay: React.FC<MessagesDisplayProps> = ({
  heading,
  savedDate,
  messages,
  unzipFilePath,
  chatFileName,
}) => {
  const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isVideo = (fileName: string) => /\.(mp4|webm|ogg)$/i.test(fileName);
  const isURI = (text: string) => {
    try {
      const cleanedText = text.substring(text.indexOf("http"));
      const url = new URL(cleanedText);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const groupedMessages: Record<string, { author: string; messages: string[][] }[]> = {};
  const basePath = `/unzipped/${chatFileName}/`;

  // Group messages by date and author
  Object.entries(messages).forEach(([date, entries]) => {
    groupedMessages[date] = entries.map((entry) => ({
      author: entry.author,
      messages: groupMessages(entry.messages), // Use the groupMessages utility function
    }));
  });

  return (
    <div>
      {/* Display the heading */}
      <h2>{heading}</h2>
      {/* Display the saved date */}
      <h3>{savedDate}</h3>
      {/* Display the grouped messages */}
      {Object.entries(groupedMessages).map(([date, entries]) => (
        <div key={date}>
          <h3>{date}</h3>
          <ul>
            {entries
              .filter((entry) => entry.author.trim() !== "Unknown") // Ignore entries with no author
              .map((entry, index) => (
                <li key={index}>
                  <strong>{entry.author}:</strong>
                  <ul>
                    {entry.messages.map((group, groupIndex) => (
                      <li key={groupIndex}>
                        {group.length > 0 && isImage(group[0]) ? (
                          // Display grouped images in a grid
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))",
                              gap: "1rem",
                            }}
                          >
                            {group.map((img, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={`${basePath}${img}`}
                                alt="Image"
                                style={{
                                  width: "100%",
                                  height: "10rem",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = "/fallback-image.jpg";
                                  console.error(`Failed to load image: ${img}`);
                                }}
                              />
                            ))}
                          </div>
                        ) : group.length === 1 && isURI(group[0]) ? (
                          // Display URI as a button
                          <button
                            onClick={() => window.open(group[0], "_blank")}
                            title={`Open link: ${group[0]}`} // Added title for better UX
                            style={{
                              padding: "0.25rem 0.75rem", // Reduced padding
                              backgroundColor: "#007BFF",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                              maxWidth: "100%", // Ensure button doesn't overflow
                              overflow: "hidden", // Hide overflow
                              textOverflow: "ellipsis", // Add ellipsis for long URIs
                              whiteSpace: "nowrap", // Prevent wrapping
                            }}
                          >
                            {group[0]} {/* Display the URI */}
                          </button>
                        ) : (
                          // Display text or single messages
                          group.map((msg, msgIndex) => <span key={msgIndex}>{msg}</span>)
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MessagesDisplay;