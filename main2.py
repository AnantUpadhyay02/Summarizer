from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from transformers import pipeline
from PyPDF2 import PdfReader
from docx import Document

# Initialize FastAPI app
app = FastAPI()

# CORS middleware for frontend integration
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

summarizer = pipeline("summarization")

async def extract_text(file: UploadFile):
    file_type = file.filename.split(".")[-1].lower()

    if file_type == "txt":
        content = await file.read()
        text = content.decode('utf-8')
    elif file_type == "pdf":
        reader = PdfReader(file.file)
        text = "".join([page.extract_text() for page in reader.pages])
    elif file_type == "docx":
        doc = Document(file.file)
        text = "\n".join([para.text for para in doc.paragraphs])
    else:
        raise ValueError("Unsupported file type")
    
    return text


def summarize_text(text):
    summary = summarizer(text, max_length=150, min_length=40, do_sample=False)
    return summary[0]['summary_text']


@app.post("/summarize/")
async def summarize_document(file: UploadFile = File(...)):
    text = await extract_text(file)
    summary = summarize_text(text)
    return {"summary": summary}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
