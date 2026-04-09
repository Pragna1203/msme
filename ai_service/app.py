import os
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List
from groq import Groq
import chromadb
from sentence_transformers import SentenceTransformer

load_dotenv()

app = FastAPI()

CSV_PATH = r"C:\Users\pragn\OneDrive\Desktop\msme_ai_agent\ecommerce_sales_data (2).csv"
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# We'll use a local chromadb client
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="business_data")

# Embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY and GROQ_API_KEY != "YOUR_GROQ_API_KEY_HERE" else None

# Pre-calculate globals
SUMMARY_METRICS = {}

def initialize_data():
    global SUMMARY_METRICS
    if not os.path.exists(CSV_PATH):
        print("Waiting for dataset...")
        return
        
    df = pd.read_csv(CSV_PATH)
    
    # Pre-compute metrics (Business Logic BEFORE generation)
    total_sales = df['Sales'].sum()
    total_profit = df['Profit'].sum()
    total_orders = len(df)
    
    # Trends
    df['Order Date'] = pd.to_datetime(df['Order Date'])
    df['MonthYear'] = df['Order Date'].dt.to_period('M')
    monthly = df.groupby('MonthYear')[['Sales', 'Profit']].sum().reset_index()
    monthly['MonthYear'] = monthly['MonthYear'].astype(str)
    
    recent_months = monthly.tail(2)
    trend_str = "Stable"
    if len(recent_months) == 2:
        prev = recent_months.iloc[0]['Sales']
        curr = recent_months.iloc[1]['Sales']
        growth = ((curr - prev) / prev) * 100 if prev > 0 else 0
        trend_str = f"{growth:.1f}% {'increase' if growth >= 0 else 'decrease'} in recent month"

    SUMMARY_METRICS = {
        "Total Sales": float(total_sales),
        "Total Profit": float(total_profit),
        "Total Orders": int(total_orders),
        "Recent Trend": trend_str,
    }
    
    # ChromaDB indexing (if collection is empty)
    if collection.count() == 0:
        print("Indexing data to ChromaDB...")
        documents = []
        ids = []
        metadatas = []
        # Sample top 100 to save embedding time, or embed all 3500.
        # For simplicity and speed in this demo, let's embed all since it's only 3500 items stringified.
        # Actually, let's embed aggregated summaries by Product/Region to be efficient.
        # But user asked for RAG retrieval on dataset. I'll take a subset or embed all.
        df_subset = df.head(1000) # Use 1000 for speed
        
        for idx, row in df_subset.iterrows():
            doc = f"On {row['Order Date']}, sold {row['Quantity']} {row['Product Name']} ({row['Category']}) in {row['Region']} region. Sales: ${row['Sales']}, Profit: ${row['Profit']}."
            documents.append(doc)
            ids.append(str(idx))
            metadatas.append({"region": str(row['Region']), "product": str(row['Product Name'])})
        
        embeddings = embedding_model.encode(documents).tolist()
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

# Initialize on startup
initialize_data()

class QueryRequest(BaseModel):
    query: str

@app.post("/process_query")
async def process_query(request: QueryRequest):
    if not groq_client:
        return {"response": "Groq API key not configured. Mock response: Your total profit is high!"}
        
    query = request.query
    
    # 1. Retrieve relevant data from RAG
    query_emb = embedding_model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_emb,
        n_results=5
    )
    
    retrieved_texts = results['documents'][0] if results['documents'] else []
    context = "\n".join(retrieved_texts)
    
    # 2. Add Pre-computed logical data
    logical_context = (
        f"Business Summaries:\n"
        f"Total Sales: ${SUMMARY_METRICS.get('Total Sales', 0):.2f}\n"
        f"Total Profit: ${SUMMARY_METRICS.get('Total Profit', 0):.2f}\n"
        f"Total Orders: {SUMMARY_METRICS.get('Total Orders', 0)}\n"
        f"Sales Trend: {SUMMARY_METRICS.get('Recent Trend', 'N/A')}\n"
    )
    
    # 3. Create prompt
    prompt = f"""You are a smart Business AI Agent for an MSME.
Use the following context from their database and the pre-computed business numbers to answer the user request.
Provide recommendations if asked. Keep replies concise and professional.

--- PRE-COMPUTED METRICS ---
{logical_context}

--- RETRIEVED DATA ROWS ---
{context}

---
User Query: {query}
Answer:"""

    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are a helpful BizSense business assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=500
        )
        response_text = completion.choices[0].message.content
        return {"response": response_text, "logical_metrics": SUMMARY_METRICS}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
