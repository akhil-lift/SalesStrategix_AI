import streamlit as st
import os
from engine import SalesStrategixEngine
from dotenv import load_dotenv

load_dotenv()

# Page configuration
st.set_page_config(
    page_title="SalesStrategix AI",
    page_icon="🎯",
    layout="wide"
)

# Load custom CSS
with open("styles.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Initialize Engine
if "engine" not in st.session_state:
    st.session_state.engine = SalesStrategixEngine()

# Header
st.markdown("""
<div class="main-header">
    <h1>SalesStrategix AI</h1>
    <p style="color: #94a3b8; font-size: 1.1rem;">Smart Playbook Companion for Sales & Business Analytics</p>
</div>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.title("⚙️ Control Center")
    
    api_key = st.text_input("OpenAI API Key", type="password", value=os.getenv("OPENAI_API_KEY", ""))
    if api_key:
        os.environ["OPENAI_API_KEY"] = api_key
        st.session_state.engine.initialize_llm(api_key)
        st.success("API Key set!")

    st.divider()
    
    st.subheader("📁 Knowledge Base")
    uploaded_files = st.file_uploader("Upload Playbooks (PDF/TXT)", accept_multiple_files=True)
    
    if uploaded_files:
        for uploaded_file in uploaded_files:
            with open(os.path.join("data", uploaded_file.name), "wb") as f:
                f.write(uploaded_file.getbuffer())
        st.success(f"Saved {len(uploaded_files)} files.")

    if st.button("🚀 Re-index Playbooks"):
        with st.spinner("Analyzing playbooks..."):
            status = st.session_state.engine.ingest_documents()
            st.info(status)

    if st.button("🗑️ Clear Chat"):
        st.session_state.messages = []
        st.rerun()

# Chat Interface
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message:
            sources_html = " ".join([f'<span class="source-tag">{s}</span>' for s in set(message["sources"])])
            st.markdown(f'<div style="margin-top: 10px;">{sources_html}</div>', unsafe_allow_html=True)

# User input
if prompt := st.chat_input("Ask about objection handling, pricing, or negotiation..."):
    # Add user message to history
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # Generate response
    with st.chat_message("assistant"):
        with st.spinner("Consulting playbooks..."):
            response = st.session_state.engine.query(prompt)
            
            if isinstance(response, str):
                st.markdown(response)
                st.session_state.messages.append({"role": "assistant", "content": response})
            else:
                answer = response["answer"]
                sources = response["sources"]
                
                st.markdown(answer)
                sources_html = " ".join([f'<span class="source-tag">{s}</span>' for s in set(sources)])
                st.markdown(f'<div style="margin-top: 10px;">{sources_html}</div>', unsafe_allow_html=True)
                
                st.session_state.messages.append({
                    "role": "assistant", 
                    "content": answer,
                    "sources": sources
                })

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #64748b; font-size: 0.8rem;">
    Powered by SalesStrategix AI • FAISS Vector Engine • GPT-3.5 Turbo
</div>
""", unsafe_allow_html=True)
