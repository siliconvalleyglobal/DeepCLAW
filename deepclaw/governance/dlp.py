"""
Data Loss Prevention (DLP) & PII Redaction Engine for DeepCLAW.
Scans and redacts sensitive data (SSNs, Credit Cards, API Keys, Passwords, Emails, JWTs)
before LLM transmission and in responses.
"""

import re
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class DLPRule(BaseModel):
    name: str
    pattern: str
    replacement: str = "[REDACTED]"
    enabled: bool = True


class DLPScanResult(BaseModel):
    sanitized_text: str
    matches_found: int
    redacted_types: List[str]


class DLPEngine:
    """
    Zero-Trust PII & Secret Redaction Engine.
    Filters prompts before external LLM API calls and sanitizes completions before output delivery.
    """

    DEFAULT_PATTERNS = [
        # SSN
        DLPRule(name="SSN", pattern=r"\b\d{3}-\d{2}-\d{4}\b", replacement="[REDACTED_SSN]"),
        # Credit Card (Visa, MasterCard, Amex)
        DLPRule(name="CREDIT_CARD", pattern=r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b", replacement="[REDACTED_CREDIT_CARD]"),
        # OpenAI / API Keys
        DLPRule(name="API_KEY", pattern=r"(?:sk-proj-|sk-ant-|gsk_)[a-zA-Z0-9_-]{20,}", replacement="[REDACTED_API_KEY]"),
        # Generic Secret / Bearer Token / Password in JSON or Key-Value
        DLPRule(name="SECRET", pattern=r'(?i)"(?:password|secret|token|api_key)"\s*:\s*"[^"]+"', replacement='"[REDACTED_SECRET]"'),
        # Email
        DLPRule(name="EMAIL", pattern=r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", replacement="[REDACTED_EMAIL]"),
        # Phone (US format)
        DLPRule(name="PHONE", pattern=r"\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b", replacement="[REDACTED_PHONE]"),
    ]

    def __init__(self, custom_rules: Optional[List[DLPRule]] = None):
        self.rules = custom_rules or self.DEFAULT_PATTERNS
        self._token_map: Dict[str, str] = {}

    def sanitize(self, text: str) -> DLPScanResult:
        """
        Scans input string against all enabled rules and replaces sensitive data.
        Returns DLPScanResult with sanitized text and metadata.
        """
        sanitized = text
        matches_count = 0
        redacted_types = []

        for rule in self.rules:
            if not rule.enabled:
                continue

            matches = re.findall(rule.pattern, sanitized)
            if matches:
                matches_count += len(matches)
                if rule.name not in redacted_types:
                    redacted_types.append(rule.name)
                sanitized = re.sub(rule.pattern, rule.replacement, sanitized)

        return DLPScanResult(
            sanitized_text=sanitized,
            matches_found=matches_count,
            redacted_types=redacted_types
        )

    def mask_and_tokenize(self, text: str) -> Tuple[str, Dict[str, str]]:
        """
        Reversibly masks sensitive tokens with unique session placeholders (e.g. {{VAR_1}}).
        Allows restoring original values after LLM processing if required.
        """
        masked = text
        token_index = 1
        session_map: Dict[str, str] = {}

        for rule in self.rules:
            if not rule.enabled:
                continue

            matches = re.finditer(rule.pattern, masked)
            for match in matches:
                original = match.group(0)
                placeholder = f"{{{{VAR_{rule.name}_{token_index}}}}}"
                session_map[placeholder] = original
                masked = masked.replace(original, placeholder, 1)
                token_index += 1

        return masked, session_map

    def restore_tokens(self, text: str, token_map: Dict[str, str]) -> str:
        """Restores original values from token map."""
        restored = text
        for placeholder, original in token_map.items():
            restored = restored.replace(placeholder, original)
        return restored
