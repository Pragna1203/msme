from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
from sentence_transformers import SentenceTransformer
import os
from dotenv import load_dotenv
from groq import Groq
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class QueryRequest(BaseModel):
    query: str

print("Loading model and DB...")
model = SentenceTransformer('all-MiniLM-L6-v2')
db_client = chromadb.PersistentClient(path="./chroma_db")
collection = db_client.get_or_create_collection(name="msme_business_data")

groq_client = None
if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
    groq_client = Groq(api_key=GROQ_API_KEY)

@app.post("/ask")
def ask_assistant(req: QueryRequest):
    if not groq_client:
        return {"response": "Groq API key not configured. Please add your Groq API Key to ai_service/.env and restart the python server."}
    
    query_text = req.query
    query_embed = model.encode([query_text])[0].tolist()
    
    results = collection.query(
        query_embeddings=[query_embed],
        n_results=5
    )
    
    context_docs = results['documents'][0] if results['documents'] else []
    context = "\\n".join(context_docs)
    
    prompt = f"""You are a helpful AI assistant for MSME (Micro, Small and Medium Enterprises) business owners. 
Use the following data context about the business to answer the user's question. 
Be concise and clear. Include some actionable insights if applicable. Do not just restate the data blindly, calculate trends if asked.

Context Data:
{context}

User Question: {query_text}"""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a business analytics assistant."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3,
        )
        return {"response": chat_completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics")
def get_analytics():
    try:
        df = pd.read_csv('dataset.csv', encoding='unicode_escape')
        # Create a Revenue column
        df['Revenue'] = df['Price'] * df['Quantity']
        # Convert Date to Month for the trend view
        df['Date'] = pd.to_datetime(df['Date'])
        # For performance, just sample/filter if needed, but we can do a full groupby
        df['Month'] = df['Date'].dt.strftime('%Y-%m')
        
        # 1. Total Revenue per Month (alias to monthly_profit to match frontend)
        monthly_profit = df.groupby('Month')['Revenue'].sum().reset_index()
        # Rename revenue column to Profit so the react frontend doesn't break immediately
        monthly_profit.rename(columns={'Revenue': 'Profit'}, inplace=True)
        monthly_profit = monthly_profit.sort_values('Month').tail(12) # Last 12 months
        monthly_profit_trend = monthly_profit.to_dict(orient='records')
        
        # 2. Revenue per Country (alias to category_revenue)
        category_revenue = df.groupby('Country')['Revenue'].sum().reset_index()
        category_revenue.rename(columns={'Country': 'Product_Category'}, inplace=True)
        category_revenue = category_revenue.sort_values('Revenue', ascending=False).head(5)
        category_revenue_data = category_revenue.to_dict(orient='records')
        
        # 3. Overall numbers
        total_revenue = float(df['Revenue'].sum())
        total_profit = float(df['Revenue'].sum()) # Mocking profit as revenue
        
        return {
            "monthly_profit": monthly_profit_trend,
            "category_revenue": category_revenue_data,
            "totals": {
                "revenue": total_revenue,
                "profit": total_profit,
                "expenses": 0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
