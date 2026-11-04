import os
import shutil
import tempfile
import unittest
from pathlib import Path
from PIL import Image
import numpy as np
import pymupdf
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.document import Document, Page
from backend.app.models.user import User
from backend.app.services.privacy import PrivacyService
from backend.app.services.reader import process_document_pages


class TestPrivacyService(unittest.TestCase):
    """
    Unit tests for Phase 3: Privacy Layer (Microsoft Presidio, Indian PII recognizers,
    and pixel-level burn-in image redaction).
    """

    def setUp(self):
        # Create isolated temporary directory for test file artifacts
        self.test_dir = tempfile.mkdtemp()
        self.test_path = Path(self.test_dir)

        # In-memory SQLite database for test runs
        self.engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.db = self.SessionLocal()

        # Seed test student user
        self.user = User(
            email="privacy_student@example.com",
            password_hash="hashed_pw_test",
            role="student",
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_aadhaar_redaction(self):
        """Aadhaar 12-digit number (with spaces) must be detected and masked."""
        raw_text = "Student Aadhaar verification number is 1234 5678 9012 for the upcoming examination."
        sanitized, count, summary = PrivacyService.redact_text(raw_text)

        self.assertGreaterEqual(count, 1)
        self.assertNotIn("1234 5678 9012", sanitized)
        self.assertIn("<IN_AADHAAR>", sanitized)
        self.assertIn("IN_AADHAAR", summary)

    def test_pan_card_redaction(self):
        """Permanent Account Number (PAN) format [A-Z]{5}[0-9]{4}[A-Z] must be redacted."""
        raw_text = "Income tax certificate PAN card number: ABCDE1234F submitted by parent."
        sanitized, count, summary = PrivacyService.redact_text(raw_text)

        self.assertGreaterEqual(count, 1)
        self.assertNotIn("ABCDE1234F", sanitized)
        self.assertIn("<IN_PAN>", sanitized)
        self.assertIn("IN_PAN", summary)

    def test_indian_phone_number_redaction(self):
        """Indian mobile phone numbers (+91 prefix or 10 digits starting 6-9) must be masked."""
        raw_text = "For emergency contact, please call mobile: +91 9876543210 or 9123456789."
        sanitized, count, _ = PrivacyService.redact_text(raw_text)

        self.assertGreaterEqual(count, 1)
        self.assertNotIn("9876543210", sanitized)
        self.assertNotIn("9123456789", sanitized)

    def test_email_address_redaction(self):
        """Standard email addresses must be replaced by <EMAIL_ADDRESS>."""
        raw_text = "Submit queries to student.helpdesk@university.ac.in before Friday."
        sanitized, count, summary = PrivacyService.redact_text(raw_text)

        self.assertGreaterEqual(count, 1)
        self.assertNotIn("student.helpdesk@university.ac.in", sanitized)
        self.assertIn("<EMAIL_ADDRESS>", sanitized)
        self.assertIn("EMAIL_ADDRESS", summary)

    def test_zero_raw_pii_in_audit_summary(self):
        """Audit summary dictionaries must record entity counts only, never raw PII strings."""
        raw_text = "Student Ramesh Kumar, Aadhaar 4321 8765 2109, PAN XYZAB9876C, contact 9876543210."
        _, _, summary = PrivacyService.redact_text(raw_text)

        for entity_key, count_val in summary.items():
            self.assertIsInstance(entity_key, str)
            self.assertIsInstance(count_val, int)
            # Ensure none of the sensitive values leaked into the summary keys
            self.assertNotIn("4321 8765 2109", entity_key)
            self.assertNotIn("XYZAB9876C", entity_key)
            self.assertNotIn("9876543210", entity_key)

    def test_pixel_level_image_redaction(self):
        """
        Verify that redact_page_image paints solid black pixels (0, 0, 0)
        over the targeted bounding boxes while preserving non-sensitive image regions.
        """
        # Create a 200x200 solid white image
        src_image_path = self.test_path / "page_1.png"
        img = Image.new("RGB", (200, 200), color=(255, 255, 255))
        img.save(src_image_path, "PNG")

        # Define simulated word boxes including an Aadhaar number
        word_boxes = [
            {"word": "Student", "box": [10, 10, 50, 25]},
            {"word": "Aadhaar", "box": [55, 10, 95, 25]},
            {"word": "1234", "box": [100, 10, 125, 25]},
            {"word": "5678", "box": [130, 10, 155, 25]},
            {"word": "9012", "box": [160, 10, 185, 25]},
        ]

        dst_image_path, count = PrivacyService.redact_page_image(
            image_path=src_image_path,
            word_boxes=word_boxes,
        )

        self.assertTrue(dst_image_path.exists())
        self.assertGreaterEqual(count, 3)  # At least 1234, 5678, 9012 blacked out

        # Read back rendered pixels using numpy
        redacted_img = Image.open(dst_image_path)
        pixel_array = np.array(redacted_img)

        # Region (105, 15) is inside the "1234" box -> must be solid black (0, 0, 0)
        black_pixel = pixel_array[15, 110]
        self.assertEqual(int(black_pixel[0]), 0)
        self.assertEqual(int(black_pixel[1]), 0)
        self.assertEqual(int(black_pixel[2]), 0)

        # Region (100, 100) is far away in white space -> must remain white (255, 255, 255)
        white_pixel = pixel_array[100, 100]
        self.assertEqual(int(white_pixel[0]), 255)
        self.assertEqual(int(white_pixel[1]), 255)
        self.assertEqual(int(white_pixel[2]), 255)

    def test_end_to_end_pdf_redaction_pipeline(self):
        """
        Verify that process_document_pages extracts pages, detects embedded PII,
        sanitizes Page.ocr_text, and writes a redacted PNG image.
        """
        pdf_path = self.test_path / "worksheet.pdf"
        doc = pymupdf.open()
        page = doc.new_page()
        # Insert test content with Indian PII
        page.insert_text(
            (72, 72),
            "Physics Lab Worksheet. Student Roll: 101. Aadhaar: 9876 5432 1098. PAN: BNZPK1234K.",
        )
        doc.save(str(pdf_path))
        doc.close()

        # Create Document record
        doc_record = Document(
            user_id=self.user.id,
            filename="worksheet.pdf",
            file_path=str(pdf_path),
            status="uploaded",
        )
        self.db.add(doc_record)
        self.db.commit()
        self.db.refresh(doc_record)

        pages = process_document_pages(doc_record, self.db)

        self.assertEqual(len(pages), 1)
        first_page = pages[0]

        # PII items must have been found and recorded
        self.assertGreaterEqual(first_page.pii_items_found, 1)

        # Extracted text must NOT contain raw Aadhaar
        self.assertNotIn("9876 5432 1098", first_page.ocr_text)

        # Redacted image file must exist on disk
        self.assertTrue(Path(first_page.image_path).exists())
        self.assertTrue(first_page.image_path.endswith("_redacted.png"))


if __name__ == "__main__":
    unittest.main()
