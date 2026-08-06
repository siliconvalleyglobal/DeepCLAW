"""
Structured output enforcement for agent responses.
Validates LLM/tool outputs against JSON schemas and Pydantic models before they reach downstream nodes.
"""

import json
from typing import Any, Dict, List, Optional, Type
from pydantic import BaseModel, ValidationError


class StructuredOutputRule(BaseModel):
    schema_name: str
    json_schema: Optional[Dict[str, Any]] = None
    pydantic_model: Optional[Type[BaseModel]] = None
    required: bool = True
    description: Optional[str] = None


class StructuredOutputEnforcer:
    _rules: Dict[str, StructuredOutputRule] = {}

    @classmethod
    def register(cls, rule: StructuredOutputRule) -> None:
        cls._rules[rule.schema_name] = rule

    @classmethod
    def validate(cls, schema_name: str, data: Any) -> Dict[str, Any]:
        rule = cls._rules.get(schema_name)
        if rule is None:
            return {"valid": True, "errors": [], "schema_name": schema_name, "note": "No rule registered; pass-through."}

        raw = data if isinstance(data, dict) else {"value": data}
        errors = []

        if rule.pydantic_model is not None:
            try:
                rule.pydantic_model(**raw)
            except ValidationError as exc:
                errors.extend([err["msg"] for err in exc.errors()])
        elif rule.json_schema is not None:
            errors.extend(cls._validate_json_schema(raw, rule.json_schema))

        valid = len(errors) == 0
        return {
            "valid": valid,
            "errors": errors,
            "schema_name": schema_name,
            "required": rule.required,
            "data": raw if valid else None,
        }

    @staticmethod
    def _validate_json_schema(data: Dict[str, Any], schema: Dict[str, Any]) -> List[str]:
        errors = []
        required = schema.get("required", [])
        for field in required:
            if field not in data:
                errors.append(f"Missing required field: {field}")
        props = schema.get("properties", {})
        for key, val in data.items():
            prop_schema = props.get(key)
            if not prop_schema:
                continue
            expected_type = prop_schema.get("type")
            if expected_type == "object" and not isinstance(val, dict):
                errors.append(f"Field '{key}' must be object")
            elif expected_type == "array" and not isinstance(val, list):
                errors.append(f"Field '{key}' must be array")
            elif expected_type == "string" and not isinstance(val, str):
                errors.append(f"Field '{key}' must be string")
            elif expected_type in ("number", "integer") and not isinstance(val, (int, float)):
                errors.append(f"Field '{key}' must be {expected_type}")
        return errors

    @classmethod
    def list_rules(cls) -> Dict[str, StructuredOutputRule]:
        return dict(cls._rules)
