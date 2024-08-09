from fastapi import FastAPI, UploadFile, File
import uvicorn
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from PyPDF2 import PdfReader
from docx import Document

model = GPT2LMHeadModel.from_pretrained("gpt2") #gpt2 model
tokenizer = GPT2Tokenizer.from_pretrained("gpt2") #tokenizer

app = FastAPI()

#function to extract the text from the uploaded file
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

def summarize_text(text, max_new_tokens=100):
    inputs = tokenizer.encode(text, return_tensors='pt', max_length=512, truncation=True)
    summary_ids = model.generate(inputs, max_new_tokens=max_new_tokens, num_beams=4, early_stopping=True)
    return tokenizer.decode(summary_ids[0], skip_special_tokens=True)

#API for summarization
@app.post("/summarize/")
async def summarize_document(file: UploadFile = File(...)):
    text = await extract_text(file)
    summary = summarize_text(text)
    return {"summary": summary}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
