# Contributing to DeepClaw 🦅

We welcome contributions to DeepClaw! As an Enterprise-Governance-First AI Agent Framework, we maintain high standards for security, type safety, test coverage, and documentation integrity.

---

## 🛠️ Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/siliconvalleyglobal/DeepCLAW.git
cd DeepCLAW

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install development dependencies
pip install -e .[dev]

# 4. Run test suite
pytest
```

---

## 📜 Development Guidelines

1. **Governance & Security First**: Any new tool or channel adapter must be routed through `deepclaw/governance/policy.py` and enforce per-channel RBAC permission ceilings.
2. **Type Hinting & Code Style**: All public functions must be typed (`mypy` compliant) and format-checked with `ruff`.
3. **Eval & Test Coverage**: Add unit tests in `tests/` for all new core features, protocol connections, and channel adapters.

---

## 🔒 Security Vulnerability Disclosures

Please review [SECURITY.md](SECURITY.md) for private vulnerability reporting guidelines. Do not open public GitHub issues for security vulnerabilities.
