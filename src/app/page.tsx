"use client";

import { useState } from "react";
import MessagesDisplay from "../components/MessagesDisplay";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
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
    console.log("fileName", file.name);
    const removeExtension = (fileName: string) => {
      return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    };
    setFileName(removeExtension(file.name));
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      console.log("api/upload response", response)
      const responseData = await response.json()
      setMessage(responseData.message)
      setFilePath(responseData.filePath)     
      console.log("api/upload responseData", responseData)
      // if (response.ok) {
      //   setMessage("File uploaded and unzipped successfully!");
      // } else {
      //   setMessage("Failed to upload or unzip the file.");
      // }
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
      <MessagesDisplay
        heading={chatData.heading}
        savedDate={chatData.savedDate}
        messages={chatData.messages}
        chatFileName={fileName}
        unzipFilePath={filePath}
      />
      <div>
        <h2>File Name:</h2>
        <p>{fileName}</p>
      </div>
      <div>
        <h2>File Path:</h2>
        <p>{filePath}</p>
      </div>
    </div>
  );
}
