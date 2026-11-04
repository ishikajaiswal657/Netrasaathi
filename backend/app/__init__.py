"""Netrasaathi backend application package."""
import sys
import types

# Ensure 'backend' and 'backend.app' are resolvable regardless of working directory or Docker container structure
if "backend" not in sys.modules:
    _backend_mod = types.ModuleType("backend")
    _backend_mod.app = sys.modules[__name__]
    sys.modules["backend"] = _backend_mod
    sys.modules["backend.app"] = sys.modules[__name__]
elif "backend.app" not in sys.modules:
    sys.modules["backend.app"] = sys.modules[__name__]
