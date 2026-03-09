"""
RAG Engine — Vector retrieval using Gemini Embeddings (text-embedding-004)
and in-memory cosine similarity.
"""

import math
import google.generativeai as genai

class RAGEngine:
    def __init__(self):
        # Store individual chunks: list of dict {"patient_id": str, "text": str, "embedding": list[float]}
        self._chunks = []

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add_document(self, patient_id: str, text: str) -> None:
        """Chunk a document, get Gemini embeddings, and store them in memory."""
        chunks = self._chunk_text(text)
        count = 0
        for i, chunk in enumerate(chunks):
            embed = self._get_embedding(chunk, task_type="retrieval_document")
            if embed:
                self._chunks.append({
                    "patient_id": patient_id,
                    "text": chunk,
                    "embedding": embed
                })
                count += 1
        print(f"[RAG] Embedded and stored {count} chunks for patient_id='{patient_id}'")

    def retrieve(self, question: str, top_k: int = 3) -> list[str]:
        """Return the top-k most relevant document texts for the query using cosine similarity."""
        if not self._chunks:
            return []

        query_vec = self._get_embedding(question, task_type="retrieval_query")
        if not query_vec:
            return []

        scores = []
        for item in self._chunks:
            doc_vec = item["embedding"]
            sim = self._cosine(query_vec, doc_vec)
            scores.append((sim, item["text"]))

        # Sort by highest similarity
        ranked = sorted(scores, key=lambda x: x[0], reverse=True)
        # Filter loosely (e.g. > 0.3) to grab good matches
        results = [text for sim, text in ranked[:top_k] if sim > 0.3]
        print(f"[RAG] Retrieved {len(results)} relevant context chunk(s) for query: '{question[:60]}...'")
        return results

    def build_context(self, question: str) -> str:
        """Format retrieved chunks into a prompt-ready context string."""
        chunks = self.retrieve(question)
        if not chunks:
            return "(No additional relevant history excerpts retrieved)"
        sections = "\n---\n".join(f"[Excerpt]\n{chunk}" for chunk in chunks)
        return f"Retrieved Context from Patient History:\n\n{sections}"

    # ------------------------------------------------------------------
    # Internal Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 200, overlap: int = 50) -> list[str]:
        """Simple word-based chunking."""
        words = text.split()
        chunks = []
        for i in range(0, len(words), chunk_size - overlap):
            chunk = " ".join(words[i:i + chunk_size])
            if chunk.strip():
                chunks.append(chunk)
        return chunks

    @staticmethod
    def _get_embedding(text: str, task_type: str = "retrieval_document") -> list[float]:
        try:
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type=task_type
            )
            return result['embedding']
        except Exception as e:
            print(f"[RAG] Embedding failed: {e}")
            return []

    @staticmethod
    def _cosine(a: list[float], b: list[float]) -> float:
        dot = sum(x * y for x, y in zip(a, b))
        mag_a = math.sqrt(sum(x * x for x in a))
        mag_b = math.sqrt(sum(y * y for y in b))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)


# Singleton instance shared across the FastAPI app
rag_engine = RAGEngine()
