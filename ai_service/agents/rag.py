"""
rag.py — Retrieval-Augmented Generation over the styling knowledge base.

Uses LangChain document loaders + a local sentence-transformers embedding model
(no cloud API needed just to build the index) and a FAISS vector store.

The index is built once at startup and cached to disk under .faiss_index/, so
restarts don't re-embed the docs every time.
"""
import os
from pathlib import Path

from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter

# CORRECT — change to this
KB_DIR = Path(__file__).parent.parent / "knowledge_base"
INDEX_DIR = Path(__file__).parent / ".faiss_index"

_embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
_vectorstore = None


def _build_index():
    loader = DirectoryLoader(str(KB_DIR), glob="**/*.md", loader_cls=TextLoader)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)
    chunks = splitter.split_documents(docs)

    store = FAISS.from_documents(chunks, _embeddings)
    INDEX_DIR.mkdir(exist_ok=True)
    store.save_local(str(INDEX_DIR))
    return store


def get_vectorstore():
    """Lazily build or load the FAISS index. Cached in module memory after first call."""
    global _vectorstore
    if _vectorstore is not None:
        return _vectorstore

    if INDEX_DIR.exists():
        _vectorstore = FAISS.load_local(
            str(INDEX_DIR), _embeddings, allow_dangerous_deserialization=True
        )
    else:
        _vectorstore = _build_index()
    return _vectorstore


def retrieve_styling_context(query: str, k: int = 4) -> str:
    """
    Returns a single string of concatenated, relevant chunks from the styling
    knowledge base for the given query (occasion + style + notes).
    """
    store = get_vectorstore()
    results = store.similarity_search(query, k=k)
    return "\n\n---\n\n".join(r.page_content for r in results)


if __name__ == "__main__":
    # quick manual test: python rag.py
    print(retrieve_styling_context("birthday dinner pastel frock budget styling"))