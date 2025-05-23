"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chatData, setChatData] = useState<{ heading: string; savedDate: string; messages: Record<string, string[]> }>({
    heading: "",
    savedDate: "",
    messages: {},
  });

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
        setChatData(data); // Update state with the new structure
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
        {/* Display the heading */}
        <h2>{chatData.heading}</h2>
        {/* Display the saved date */}
        <h3>{chatData.savedDate}</h3>
        {/* Display the messages */}
        {Object.entries(chatData.messages).map(([date, messages]) => (
          <div key={date}>
            <h3>{date}</h3>
            <ul>
              {messages.map((msg, index) => (
                <li key={index}>{msg}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
