import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv

load_dotenv()

class SalesStrategixEngine:
    def __init__(self, data_path: str = "data", index_path: str = "vector_store"):
        self.data_path = data_path
        self.index_path = index_path
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_db = None
        self.llm = None
        
        if not os.path.exists(self.data_path):
            os.makedirs(self.data_path)
            
    def initialize_llm(self, api_key: str = None):
        """Initialize the LLM with the provided API key."""
        key = api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            raise ValueError("OpenAI API Key is required for generation.")
        self.llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0, openai_api_key=key)

    def ingest_documents(self):
        """Load documents from the data directory and create a vector store."""
        # Support for PDF and Text files
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
            self.vector_db = FAISS.load_local(self.index_path, self.embeddings, allow_dangerous_deserialization=True)
            return True
        return False

    def query(self, user_query: str):
        """Query the RAG system and return a response."""
        if not self.vector_db:
            if not self.load_index():
                return "Vector store not found. Please index documents first."
        
        if not self.llm:
            try:
                self.initialize_llm()
            except ValueError:
                return "LLM not initialized. Please provide an API key."

        prompt_template = """
        You are SalesStrategix AI, a smart sales playbook companion. 
        Your goal is to provide concise, professional, and actionable advice grounded ONLY in the provided playbook context.
        If the answer is not in the context, politely say that the information is not available in the current playbooks.
        
        Context: {context}
        Question: {question}
        
        Actionable Sales Guidance:
        """
        PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
        
        chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vector_db.as_retriever(search_kwargs={"k": 3}),
            chain_type_kwargs={"prompt": PROMPT},
            return_source_documents=True
        )
        
        result = chain.invoke({"query": user_query})
        return {
            "answer": result["result"],
            "sources": [doc.metadata.get("source", "Unknown") for doc in result["source_documents"]]
        }

if __name__ == "__main__":
    # Quick test
    engine = SalesStrategixEngine()
    print("Engine initialized.")
