import pandas as pd
import chromadb
from sentence_transformers import SentenceTransformer
import os

def run_ingest():
    print("Loading data...")
    df = pd.read_csv('dataset.csv', encoding='unicode_escape')
    df['Revenue'] = df['Price'] * df['Quantity']
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.strftime('%Y-%m')
    
    print("Aggregating insights for AI Memory...")
    documents = []
    ids = []
    
    # 1. Total Overview
    total_rev = df['Revenue'].sum()
    documents.append(f"The total overall revenue for the business across all time is ${total_rev:.2f}.")
    ids.append("doc_total")
    
    # 2. Monthly summaries
    monthly_rev = df.groupby('Month')['Revenue'].sum().reset_index()
    for idx, row in monthly_rev.iterrows():
        documents.append(f"In the month of {row['Month']}, the business generated a total revenue of ${row['Revenue']:.2f}.")
        ids.append(f"doc_month_{idx}")
        
    # 3. Top Countries
    country_rev = df.groupby('Country')['Revenue'].sum().sort_values(ascending=False).head(20).reset_index()
    for idx, row in country_rev.iterrows():
        documents.append(f"The country {row['Country']} generated a total revenue of ${row['Revenue']:.2f} for the business.")
        ids.append(f"doc_country_{idx}")
        
    # 4. Top 100 Products
    product_rev = df.groupby('ProductName')['Revenue'].sum().sort_values(ascending=False).head(100).reset_index()
    for idx, row in product_rev.iterrows():
        documents.append(f"The product '{row['ProductName']}' is a top seller, generating a total revenue of ${row['Revenue']:.2f}.")
        ids.append(f"doc_top_product_{idx}")

    print(f"Generated {len(documents)} strategic factual documents. Initializing embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(documents).tolist()

    print("Storing in ChromaDB...")
    client = chromadb.PersistentClient(path="./chroma_db")
    # Delete old collection to prevent clash
    try:
        client.delete_collection(name="msme_business_data")
    except:
        pass
        
    collection = client.create_collection(name="msme_business_data")
    
    # Upsert data
    collection.upsert(
        documents=documents,
        embeddings=embeddings,
        ids=ids
    )
    print("Ingestion complete!")

if __name__ == "__main__":
    run_ingest()
