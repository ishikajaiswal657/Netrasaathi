import logging
import re
from typing import Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from backend.app.config import get_settings
from backend.app.models.document import Block, Document, Page

logger = logging.getLogger("netrasaathi.qa")
settings = get_settings()


class PassageChunk:
    """Represents a searchable passage from an uploaded study document."""

    def __init__(
        self,
        page_number: int,
        block_type: str,
        title: str,
        text: str,
    ):
        self.page_number = page_number
        self.block_type = block_type
        self.title = title
        self.text = text.strip()

    def to_search_text(self) -> str:
        return f"{self.title}. {self.text}".strip()


class QAService:
    """
    Intelligent Grounded Q&A Service for Netrasaathi.
    Uses TF-IDF retrieval across document passages and OpenAI synthesis to answer
    student questions strictly using the document's content with zero hallucinations.
    """

    @classmethod
    def extract_document_passages(cls, document: Document) -> list[PassageChunk]:
        """Collects searchable text passages across all pages and explanation blocks of the document."""
        passages: list[PassageChunk] = []

        for page in document.pages:
            # Add blocks if present
            if page.blocks:
                for b in page.blocks:
                    if b.explanation_text and b.explanation_text.strip():
                        passages.append(
                            PassageChunk(
                                page_number=page.page_number,
                                block_type=b.block_type,
                                title=b.title or f"{b.block_type.capitalize()} Section {b.order_index}",
                                text=b.explanation_text,
                            )
                        )
            # Add raw page text if blocks were not yet generated
            elif page.ocr_text and page.ocr_text.strip():
                paragraphs = [p.strip() for p in page.ocr_text.split("\n\n") if p.strip()]
                for idx, para in enumerate(paragraphs, start=1):
                    passages.append(
                        PassageChunk(
                            page_number=page.page_number,
                            block_type="text",
                            title=f"Page {page.page_number} Section {idx}",
                            text=para,
                        )
                    )

        return passages

    @classmethod
    def retrieve_relevant_passages(
        cls,
        passages: list[PassageChunk],
        query: str,
        top_k: int = 3,
        threshold: float = 0.04,
    ) -> list[tuple[PassageChunk, float]]:
        """
        Calculates TF-IDF cosine similarity between the student query and all document passages.
        Returns top matching passages above the minimum relevance threshold.
        """
        if not passages or not query.strip():
            return []

        search_corpus = [p.to_search_text() for p in passages]

        try:
            vectorizer = TfidfVectorizer(
                stop_words="english",
                ngram_range=(1, 2),
                token_pattern=r"(?u)\b\w+\b",
            )
            tfidf_matrix = vectorizer.fit_transform(search_corpus)
            query_vec = vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, tfidf_matrix).flatten()

            # Rank by score descending
            ranked_indices = similarities.argsort()[::-1]

            results: list[tuple[PassageChunk, float]] = []
            for idx in ranked_indices:
                score = float(similarities[idx])
                if score >= threshold:
                    results.append((passages[idx], score))
                    if len(results) >= top_k:
                        break

            return results
        except Exception as exc:
            logger.warning(f"TF-IDF retrieval fallback due to error: {exc}")
            # Fallback keyword matching
            q_terms = set(re.findall(r"\w+", query.lower()))
            fallback_results: list[tuple[PassageChunk, float]] = []
            for p in passages:
                p_lower = p.text.lower()
                matches = sum(1 for term in q_terms if term in p_lower)
                if matches > 0:
                    fallback_results.append((p, float(matches)))
            fallback_results.sort(key=lambda x: x[1], reverse=True)
            return fallback_results[:top_k]

    @classmethod
    def answer_question(
        cls,
        document: Document,
        question: str,
        db: Session,
    ) -> tuple[str, list[int]]:
        """
        Answers the student's question based strictly on the document content.
        Returns (spoken_answer, list_of_relevant_page_numbers).
        """
        clean_q = question.strip()
        if not clean_q:
            return (
                "Please speak or type a clear question about your study material.",
                [],
            )

        passages = cls.extract_document_passages(document)
        if not passages:
            return (
                "This document does not contain any readable text or explanation blocks yet.",
                [],
            )

        matched_passages = cls.retrieve_relevant_passages(passages, clean_q, top_k=3)

        if not matched_passages:
            return (
                "I could not find an answer to that question in your study document. "
                "Please ask about the diagrams, flowcharts, or topics covered on these pages.",
                [],
            )

        relevant_pages = sorted(list({p.page_number for p, _ in matched_passages}))
        top_passage, top_score = matched_passages[0]

        # Check if OpenAI API key is available for synthesis
        api_key = settings.OPENAI_API_KEY
        if api_key and api_key not in ["mock", "test", ""] and not api_key.startswith("your_openai"):
            try:
                from openai import OpenAI

                client = OpenAI(api_key=api_key)

                context_blocks_str = "\n\n".join(
                    [
                        f"[Page {p.page_number} - {p.title}]: {p.text}"
                        for p, _ in matched_passages
                    ]
                )

                system_prompt = (
                    "You are Netrasaathi, a friendly and accessible tutor answering a student's question "
                    "about their study material.\n"
                    "Rules:\n"
                    "1. Answer strictly using ONLY the provided excerpts below.\n"
                    "2. Explain in clear, easy-to-understand spoken words without difficult jargon.\n"
                    "3. Always mention the page number (e.g., 'According to Page 1...').\n"
                    "4. If the excerpt does not contain the answer, say honestly that it is not covered.\n"
                    "5. Keep the explanation concise and voice-friendly (2-4 sentences)."
                )

                response = client.chat.completions.create(
                    model=settings.MODEL_NAME,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": (
                                f"Document excerpts:\n\n{context_blocks_str}\n\n"
                                f"Student Question: {clean_q}"
                            ),
                        },
                    ],
                    max_tokens=400,
                    temperature=0.2,
                )

                answer_text = response.choices[0].message.content
                if answer_text and answer_text.strip():
                    return answer_text.strip(), relevant_pages

            except Exception as exc:
                logger.warning(f"OpenAI Q&A generation failed ({exc}); falling back to deterministic synthesis.")

        # Deterministic Grounded Synthesis Fallback (Offline / Dev mode)
        # Find the most relevant sentences in the top passage
        sentences = [s.strip() for s in re.split(r"[.\n]+", top_passage.text) if s.strip()]
        q_words = set(re.findall(r"\w+", clean_q.lower()))

        best_sentences: list[str] = []
        for s in sentences:
            s_words = set(re.findall(r"\w+", s.lower()))
            overlap = len(q_words & s_words)
            if overlap > 0:
                best_sentences.append(s)

        if not best_sentences:
            best_sentences = sentences[:2]

        excerpt = ". ".join(best_sentences[:2])
        if not excerpt.endswith("."):
            excerpt += "."

        spoken_answer = (
            f"According to Page {top_passage.page_number} ({top_passage.title}): {excerpt}"
        )

        return spoken_answer, relevant_pages

