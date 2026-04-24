import os
import time
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

class SalesStrategixEngine:
    def __init__(self, data_path: str = "data", index_path: str = "vector_store"):
        self.data_path = data_path
        self.index_path = index_path
        self.embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_db = None
        self.llm = None

        if not os.path.exists(self.data_path):
            os.makedirs(self.data_path)

    def initialize_llm(self, api_key: str = None):
        """Initialize the Groq LLM with the provided API key."""
        key = api_key or os.getenv("GROQ_API_KEY")
        if not key:
            raise ValueError("Groq API Key is required for generation.")
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            groq_api_key=key,
            temperature=0,
        )

    def ingest_documents(self):
        """Load documents from the data directory and create a vector store."""
        pdf_loader = DirectoryLoader(self.data_path, glob="*.pdf", loader_cls=PyPDFLoader)
        txt_loader = DirectoryLoader(self.data_path, glob="*.txt", loader_cls=TextLoader)

        documents = pdf_loader.load() + txt_loader.load()

        if not documents:
            return "No documents found in the data directory."

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)

        self.vector_db = FAISS.from_documents(chunks, self.embeddings)
        self.vector_db.save_local(self.index_path)
        return f"Successfully indexed {len(documents)} documents into {len(chunks)} chunks."

    def load_index(self):
        """Load the FAISS index from disk."""
        if os.path.exists(self.index_path):
            self.vector_db = FAISS.load_local(
                self.index_path,
                self.embeddings,
                allow_dangerous_deserialization=True
            )
            return True
        return False

    def query(self, user_query: str):
        """Query the RAG system and return a response."""
        if not self.vector_db:
            if not self.load_index():
                return "Vector store not found. Please click 'Re-index Playbooks' first."

        if not self.llm:
            try:
                self.initialize_llm()
            except ValueError:
                return "LLM not initialized. Please provide a Groq API Key in the sidebar."

        retriever = self.vector_db.as_retriever(search_kwargs={"k": 3})

        system_prompt = """You are SalesStrategix AI, a smart sales playbook companion.
Your goal is to provide concise, professional, and actionable advice grounded ONLY in the provided playbook context.
If the answer is not in the context, politely say that the information is not available in the current playbooks.

Context:
{context}"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}"),
        ])

        def format_docs(docs):
            return "\n\n".join(doc.page_content for doc in docs)

        chain = (
            {"context": retriever | format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )

        docs = retriever.invoke(user_query)

        # Retry with backoff for rate limit errors
        max_retries = 3
        for attempt in range(max_retries):
            try:
                answer = chain.invoke(user_query)
                return {
                    "answer": answer,
                    "sources": [doc.metadata.get("source", "Unknown") for doc in docs]
                }
            except Exception as e:
                err = str(e)
                if "429" in err or "rate_limit" in err.lower() or "RateLimitError" in err:
                    if attempt < max_retries - 1:
                        wait = (attempt + 1) * 10  # 10s, 20s, 30s
                        time.sleep(wait)
                        continue
                    return (
                        "⚠️ **Groq Rate Limit Reached.** Please wait a moment and try again.\n"
                        "You can also get a free API key at https://console.groq.com/keys"
                    )
                raise

if __name__ == "__main__":
    engine = SalesStrategixEngine()
    print("Engine initialized successfully.")
