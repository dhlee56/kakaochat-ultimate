import groupMessages from "@/utils/groupMessages";
import { group } from "console";
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
      // Remove characters before "http"
      const cleanedText = text.substring(text.indexOf("http"));
      const url = new URL(cleanedText);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const groupedMessages: Record<string, { author: string; messages: Set<string[]> }[]> = {};
  const basePath = `/unzipped/${chatFileName}/`;
  Object.entries(messages).forEach(([date, entries]) => {
    groupedMessages[date] = entries.map((entry) => ({
      author: entry.author,
      messages: new Set(
        groupMessages(entry.messages)
      ), 
    }));
  });

  return (
    <div>
      {/* Display the heading */}
      <h2>{heading}</h2>
      {/* Display the saved date */}
      <h3>{savedDate}</h3>
      {/* Display the messages */}
      {Object.entries(messages).map(([date, entries]) => (
        <div key={date}>
          <h3>{date}</h3>
          <ul>
            {entries
              .filter((entry) => entry.author.trim() !== "Unknown") // Ignore entries with no author
              .map((entry, index) => (
                <li key={index}>
                  <strong>{entry.author}:</strong>
                  <ul>
                    {entry.messages.map((msg, msgIndex) => (
                      <li key={msgIndex}>
                        {isImage(msg) ? (
                          <img
                            src={`${basePath}${msg}`} // Prepend the base path to the message
                            alt="Image"
                            style={{
                              width: "10rem",
                              height: "10rem",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.currentTarget.src = "/fallback-image.jpg"; // Optional fallback image
                              console.error(`Failed to load image: ${msg}`);
                            }}
                          />
                        ) : isVideo(msg) ? (
                          <video
                            controls
                            style={{ maxWidth: "100%" }}
                            onError={() =>
                              console.error(`Failed to load video: ${msg}`)
                            }
                          >
                            <source
                              src={`${basePath}${msg}`}
                              type={`video/${msg.split(".").pop()}`}
                            />
                            Your browser does not support the video tag.
                          </video>
                        ) : isURI(msg) ? (
                          <button
                            onClick={() => window.open(msg, "_blank")}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#007BFF",
                              color: "#fff",
                              border: "none",
                              borderRadius: "5px",
                              cursor: "pointer",
                            }}
                          >
                            Open Link
                          </button>
                        ) : (
                          msg
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