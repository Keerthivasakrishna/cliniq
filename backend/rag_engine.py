"""
RAG Engine — In-memory retrieval using TF-IDF + cosine similarity.
No external vector DB required. Perfect for hackathon use.
"""

import math
import re
from collections import defaultdict


class RAGEngine:
    def __init__(self):
        # Store: {doc_id: raw_text}
        self._documents: dict[str, str] = {}
        # TF-IDF cache: {doc_id: {term: tfidf_score}}
        self._tfidf: dict[str, dict[str, float]] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def add_document(self, patient_id: str, text: str) -> None:
        """Store a document (case sheet text) under the given patient ID."""
        self._documents[patient_id] = text
        self._rebuild_tfidf()
        print(f"[RAG] Stored document for patient_id='{patient_id}' "
              f"({len(self._documents)} total documents in store)")

    def retrieve(self, question: str, top_k: int = 2) -> list[str]:
        """Return the top-k most relevant document texts for the query."""
        if not self._documents:
            return []

        query_vec = self._tfidf_vector(self._tokenize(question))
        scores = {}
        for doc_id, doc_vec in self._tfidf.items():
            scores[doc_id] = self._cosine(query_vec, doc_vec)

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        results = [self._documents[doc_id] for doc_id, _ in ranked[:top_k] if scores[doc_id] > 0]
        print(f"[RAG] Retrieved {len(results)} relevant context chunk(s) for query: '{question[:60]}...'")
        return results

    def build_context(self, question: str) -> str:
        """Format retrieved chunks into a prompt-ready context string."""
        chunks = self.retrieve(question)
        if not chunks:
            return "(No patient history available in store)"
        sections = "\n---\n".join(f"[Record]\n{chunk}" for chunk in chunks)
        return f"Relevant patient records retrieved from clinical history:\n\n{sections}"

    # ------------------------------------------------------------------
    # Internal TF-IDF helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        return re.findall(r"[a-z0-9]+", text.lower())

    def _rebuild_tfidf(self) -> None:
        """Recompute TF-IDF for all stored documents."""
        corpus = {doc_id: self._tokenize(text) for doc_id, text in self._documents.items()}
        N = len(corpus)

        # Document frequencies
        df: dict[str, int] = defaultdict(int)
        for tokens in corpus.values():
            for term in set(tokens):
                df[term] += 1

        # Compute TF-IDF per document
        self._tfidf = {}
        for doc_id, tokens in corpus.items():
            tf: dict[str, float] = defaultdict(float)
            for term in tokens:
                tf[term] += 1
            total = len(tokens) or 1
            vec = {}
            for term, count in tf.items():
                tfidf = (count / total) * math.log((N + 1) / (df[term] + 1))
                vec[term] = tfidf
            self._tfidf[doc_id] = vec

    def _tfidf_vector(self, tokens: list[str]) -> dict[str, float]:
        """Build a simple TF vector for a query (no IDF reweighting needed)."""
        vec: dict[str, float] = defaultdict(float)
        total = len(tokens) or 1
        for t in tokens:
            vec[t] += 1 / total
        return dict(vec)

    @staticmethod
    def _cosine(a: dict, b: dict) -> float:
        dot = sum(a.get(k, 0) * b.get(k, 0) for k in a)
        mag_a = math.sqrt(sum(v * v for v in a.values()))
        mag_b = math.sqrt(sum(v * v for v in b.values()))
        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)


# Singleton instance shared across the FastAPI app
rag_engine = RAGEngine()
