const groupMessages = (messages: string[]): string[][] => {
  const isImage = (fileName: string) => /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  const isURI = (text: string) => {
    try {
      const cleanedText = text.substring(text.indexOf("http"));
      const url = new URL(cleanedText);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const groupedMessages: string[][] = [];
  let imageGroup: string[] = [];

  messages.forEach((msg) => {
    if (isImage(msg)) {
      // Add image to the current image group
      imageGroup.push(msg);
    } else {
      // If it's not an image, finalize the current image group (if any)
      if (imageGroup.length > 0) {
        groupedMessages.push(imageGroup);
        imageGroup = [];
      }

      // Add text or URI as a singleton array
      if (isURI(msg)) {
        groupedMessages.push([msg]); // URI as a singleton
      } else {
        groupedMessages.push([msg]); // Text as a singleton
      }
    }
  });

  // Push any remaining images as the last group
  if (imageGroup.length > 0) {
    groupedMessages.push(imageGroup);
  }

  return groupedMessages;
};

export default groupMessages;