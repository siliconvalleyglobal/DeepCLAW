"""
Pre-execution input validation tuned for overeager and adversarial behavior.
"""

import re
from typing import Any, Dict, List, Tuple

SUSPICIOUS_PATTERNS = [
    r"rm\s+-rf\s+/",
    r"DROP\s+TABLE",
    r"eval\(",
    r"exec\(",
    r"import\s+os;\s*os\.system",
    r"DELETE\s+FROM",
]


class ToolGuardrails:
    """Validates tool arguments prior to execution."""

    @staticmethod
    def validate_arguments(tool_name: str, args: Dict[str, Any]) -> Tuple[bool, List[str]]:
        violations = []
        raw_str = str(args)

        for pattern in SUSPICIOUS_PATTERNS:
            if re.search(pattern, raw_str, re.IGNORECASE):
                violations.append(f"Adversarial or destructive payload detected matching '{pattern}'")

        if violations:
            return False, violations
        return True, []
