"""
Subprocess Sandbox Isolation Engine (Pillar 2)
Executes untrusted agent actions/code inside an isolated subprocess boundary.
"""

import sys
import subprocess
import json
import os
from typing import Dict, Any, Callable

class SubprocessSandbox:
    """
    Isolated Subprocess Execution Environment for untrusted agent tools.
    """

    def __init__(self, timeout_seconds: float = 5.0):
        self.timeout_seconds = timeout_seconds

    def execute_code(self, python_code: str, env_override: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Executes Python code in a isolated child process with timeout protection.
        """
        clean_env = {
            "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
            "PYTHONPATH": sys.path[0] if sys.path else "."
        }
        if env_override:
            clean_env.update(env_override)

        try:
            res = subprocess.run(
                [sys.executable, "-c", python_code],
                env=clean_env,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds
            )
            return {
                "success": res.returncode == 0,
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "exit_code": res.returncode
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution timed out after {self.timeout_seconds} seconds",
                "exit_code": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": str(e),
                "exit_code": -1
            }

    def execute_tool(self, func: Callable, *args, **kwargs) -> Dict[str, Any]:
        """
        Executes an in-process tool within safe try/catch isolation wrapper.
        """
        try:
            res = func(*args, **kwargs)
            return {"success": True, "result": res}
        except Exception as e:
            return {"success": False, "error": str(e)}

# Alias for backward compatibility
ExecutionSandbox = SubprocessSandbox
