import React from "react";

interface MessagesDisplayProps {
  heading: string;
  savedDate: string;
  messages: Record<string, string[]>;
}

const MessagesDisplay: React.FC<MessagesDisplayProps> = ({ heading, savedDate, messages }) => {
  return (
    <div>
      {/* Display the heading */}
      <h2>{heading}</h2>
      {/* Display the saved date */}
      <h3>{savedDate}</h3>
      {/* Display the messages */}
      {Object.entries(messages).map(([date, msgs]) => (
        <div key={date}>
          <h3>{date}</h3>
          <ul>
            {msgs.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default MessagesDisplay;