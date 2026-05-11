# MSME Business Insights AI Agent

This project is a full-stack Generative AI application that processes business data, performs MSME analytics, and provides an interactive chat interface using Retrieval-Augmented Generation (RAG).

## Installation & Running

The application requires three separate terminals to run all of its services.

### 1. Python AI Service (Port 8000)
This service handles data embeddings, vector search (ChromaDB), and communicates with the Groq Language Model for the AI responses.

Open a terminal in the `ai_service` directory and run:

```bash
cd ai_service
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 2. Node.js Backend (Port 5000)
This service acts as a proxy between your frontend and the AI microservice.

Open a new terminal in the `backend` directory and run:

```bash
cd backend
npm install
node server.js
```

### 3. React Frontend (Port 5173) 
This is the beautiful user interface where you view analytics and chat with the AI.

Open a new terminal in the `frontend` directory and run:

```bash
cd frontend
npm install
npm run dev
```

Finally, open the URL provided by Vite (usually `http://localhost:5173`) in your browser.
