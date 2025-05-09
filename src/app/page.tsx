"use client";

import { useState } from "react";
import MessagesDisplay from "../components/MessagesDisplay";

export default function Home() {
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [message, setMessage] = useState("");
  const [chatData, setChatData] = useState<{ heading: string; savedDate: string; messages: Record<string, { author: string; messages: string[] }[]> }>({
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
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("An error occurred during the upload.");
    }
  };

  const handleDisplayMessages = async () => {
    if (!fileName) {
      setMessage("Please select a file or set a directory first.");
      return;
    }
    try {
      const response = await fetch(`/api/read-messages?fileName=${fileName}`);
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

  const handleDirectorySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setMessage("No directory selected or directory appears empty. Please ensure it's in public/unzipped/");
      setFileName("");
      setFilePath("");
      event.target.value = ""; // Clear the input
      return;
    }

    // All files in the list will share the same base directory in their webkitRelativePath.
    // e.g., "selectedDir/file1.txt", "selectedDir/subdir/file2.txt"
    const firstFile = files[0];
    if (firstFile.webkitRelativePath) {
      const pathParts = firstFile.webkitRelativePath.split('/');
      const directoryName = pathParts[0];

      if (!directoryName) {
          setMessage("Could not determine directory name from selection.");
          setFileName("");
          setFilePath("");
          return;
      }

      setFileName(directoryName);
      setFilePath(`unzipped/${directoryName}`);
      setMessage(`Directory "${directoryName}" selected. Assumed to be at public/unzipped/${directoryName}. Ready to display messages.`);
    } else {
      setMessage("Browser does not support directory path detection for this selection. Try a different browser or ensure the directory is not empty.");
      setFileName("");
      setFilePath("");
    }
    event.target.value = ""; // Clear the file input so the same directory can be selected again
  };
  const areMessagesDisplayed = Object.keys(chatData.messages).length > 0;

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>  
      {!areMessagesDisplayed && (
        <>
          <h1 style={{ textAlign: "center" }}>Chat Viewer</h1>
          
          <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #eee", borderRadius: "8px" }}>
            <h2>Option 1: Upload a .zip file</h2>
            <input type="file" accept=".zip" onChange={handleFileUpload} style={{ display: "block", marginBottom: "10px" }} />
          </div>

          <p style={{ textAlign: "center", margin: "20px 0", fontWeight: "bold" }}>OR</p>

          <div style={{ marginBottom: "30px", padding: "20px", border: "1px solid #eee", borderRadius: "8px" }}>
            <h2>Option 2: Load from existing directory</h2>
            <p style={{ fontSize: "0.9em", color: "#555" }}>(Assumes the directory has been copied to <code>public/unzipped/</code> on the server)</p>
            <input
              type="file"
              // @ts-ignore - webkitdirectory is a non-standard attribute
              webkitdirectory=""
              mozdirectory="" // For Firefox
              directory=""    // Standard attempt, less supported for functionality
              onChange={handleDirectorySelect}
              style={{ display: "none" }} // Hide the actual input
              id="directory-picker"
            />
            <button 
              onClick={() => document.getElementById('directory-picker')?.click()} 
              style={{ padding: "8px 15px" }}
            >
              Select Chat Directory
            </button>
          </div>
          
          <hr style={{ margin: "30px 0" }} />

          <button onClick={handleDisplayMessages} disabled={!fileName} style={{ padding: "10px 20px", fontSize: "1.1em", display: "block", margin: "0 auto 20px auto" }}>
            Display Chat Messages
          </button>
          {message && <p>{message}</p>}
        </>
      )}
      
      {fileName && !areMessagesDisplayed && (
        <div style={{ marginTop: "20px", padding: "15px", border: "1px dashed #ccc", borderRadius: "8px" }}>
          <h3>Current Chat Selection:</h3>
          <div>
            <p><strong>Name:</strong> {fileName}</p>
          </div>
          {filePath && (
            <div>
              <p><strong>Assumed Path:</strong> <code>{filePath}</code></p>
            </div>
          )}
        </div>
      )}

      {areMessagesDisplayed && (
        <MessagesDisplay
          heading={chatData.heading}
          savedDate={chatData.savedDate}
          messages={chatData.messages}
          chatFileName={fileName}
          setChatData={setChatData} // Pass setChatData to MessagesDisplay
        />
      )}
    </div>
  );
}
