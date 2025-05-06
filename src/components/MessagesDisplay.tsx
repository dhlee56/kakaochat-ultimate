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

  // Construct the base path for the chat directory
  const basePath = `/unzipped/${chatFileName}/`;

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
                              width: "20rem",
                              height: "20rem",
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