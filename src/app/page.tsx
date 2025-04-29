"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<string, { author: string; content: (string | { uri?: string; imageFileName?: string })[] }[]>>({});

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("File uploaded and unzipped successfully!");
      } else {
        setMessage("Failed to upload or unzip the file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("An error occurred during the upload.");
    }
  };

  const handleDisplayMessages = async () => {
    try {
      const response = await fetch("/api/read-messages");
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      } else {
        setMessage("Failed to read chat messages.");
      }
    } catch (error) {
      console.error("Error reading chat messages:", error);
      setMessage("An error occurred while reading chat messages.");
    }
  };

  return (
    <div>
      <h1>Upload and Unzip</h1>
      <input type="file" accept=".zip" onChange={handleFileUpload} />
      <button onClick={handleDisplayMessages}>Display Chat Messages</button>
      <p>{message}</p>
      <div>
        {Object.entries(chatMessages).map(([date, messages]) => (
          <div key={date}>
            <h2>{date}</h2>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>
                  <strong>{msg.author}:</strong>
                  <ul>
                    {msg.content.map((item, idx) => (
                      <li key={idx}>
                        {typeof item === "string" && item}
                        {typeof item === "object" && item.uri && (
                          <a href={item.uri} target="_blank" rel="noopener noreferrer">
                            {item.uri}
                          </a>
                        )}
                        {typeof item === "object" && item.imageFileName && (
                          <span>{item.imageFileName}</span>
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
    </div>
  );
}
