import React, { useState, useRef } from "react";
import "./App.css";
import axios from "axios";

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [responseText, setResponseText] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const fileType = file.type;

    if (file) {
      setSelectedFile(file);

      if (fileType === "application/pdf") {
        setPreviewUrl(URL.createObjectURL(file));
        setPreviewContent("");
      } else if (fileType === "text/plain") {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewContent(reader.result);
          setPreviewUrl("");
        };
        reader.readAsText(file);
      } else if (file.name.endsWith(".docx")) {
        setPreviewUrl(URL.createObjectURL(file));
        setPreviewContent(
          "DOCX file cannot be previewed directly. Click to download."
        );
      } else {
        alert("Unsupported file type. Please select a PDF, DOCX, or TXT file.");
      }
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setPreviewContent("");
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      alert("Please select a file before submitting");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post("http://localhost:8000/summarize/", formData);

      const responseData = await response.data.summary;
      console.log(response)
      setResponseText(responseData);
    } catch (error) {
      console.error("Error uploading file:", error);
      setResponseText("Error uploading file.");
    }
  };

  return (
    <div className="file-upload-container">
      <h3>Upload & Summarize Pdf, Docx, or Txt</h3>
      <form onSubmit={handleSubmit}>
        <div className="file-input">
          <label>Select a file (PDF, DOCX, or TXT):</label>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </div>
        {selectedFile && (
          <div className="file-preview">
            <div className="file-header">
              <h4>File Preview:</h4>
              <button className="remove-file" onClick={handleFileRemove}>
                Remove File
              </button>
            </div>
            {previewUrl &&
              (selectedFile.type === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title="PDF Preview"
                  width="100%"
                  height="400px"
                />
              ) : (
                <a href={previewUrl} download={selectedFile.name}>
                  {previewContent}
                </a>
              ))}
            {previewContent && !previewUrl && <pre>{previewContent}</pre>}
          </div>
        )}
        <div className="submit-btn-div">
          <button type="submit" className="submit-button">
            Upload File
          </button>
        </div>
      </form>
      {responseText && (
        <div className="response-text">
          <h4>Server Response:</h4>
          <p>{responseText}</p>
        </div>
      )}
    </div>
  );
};

export default App;
