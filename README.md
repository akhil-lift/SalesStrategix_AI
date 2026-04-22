# SalesStrategix AI: Smart Playbook Companion

A RAG-based sales assistant that indexes internal playbooks and generates summarized guidance for sales representatives.

## Features
- **Intelligent Retrieval**: Uses FAISS and Sentence Transformers to find relevant playbook sections.
- **Actionable Guidance**: Generates grounded responses for objection handling, negotiation, and pricing.
- **Premium UI**: Modern Streamlit interface with chat history and source citations.
- **Dynamic Indexing**: Upload new PDFs or TXT files and re-index them instantly.

## Tech Stack
- **Python**
- **Streamlit** (UI)
- **FAISS** (Vector Database)
- **LangChain** (Orchestration)
- **Sentence Transformers** (Embeddings)
- **OpenAI GPT-3.5 Turbo** (Generation)

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up OpenAI API Key**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_api_key_here
   ```
   *Alternatively, you can enter the API key directly in the application sidebar.*

3. **Run the Application**:
   ```bash
   streamlit run app.py
   ```

4. **Index Documents**:
   - Place your sales playbooks (PDF/TXT) in the `data/` folder or upload them via the sidebar.
   - Click "Re-index Playbooks" to build the vector store.

## Project Structure
- `app.py`: Streamlit frontend.
- `engine.py`: RAG logic and vector store management.
- `styles.css`: Custom premium styling.
- `data/`: Directory for input playbooks.
- `vector_store/`: Persistent FAISS index.
