---
category: Complexity Avoidance
category-id: 6
theme: Avoidance
source: chat-interaction-corpus
project: [anonymized]
file: null
evidentiary-status: verbatim
audit-status: manual-verified
detector: getImplementationStandards
---

[... excerpt truncated ...] # --- Parser Class (simplified, copy from selfdrive/modeld/parse_model_outputs.py) ---
# You'll need the Parser class and its helper functions (safe_exp, sigmoid, softmax)
# from selfdrive.modeld.parse_model_outputs import Parser
# For simplicity, let's assume you've copied it into this file or an adjacent one.
# Placeholder for where the Parser class definition would go:
class Parser:
    def __init__(self, ignore_missing=False):
        self.ignore_missing = ignore_missing
    def check_missing(self, outs, name):
        if name not in outs and not self.ignore_missing:
            raise ValueError(f"Missing output {name}")
        return name not in outs
    def parse_categorical_crossentropy(self, name, outs, out_shape=None):
        # ... [... excerpt truncated ...]

## Why this is Complexity Avoidance

The Parser class has non-trivial behaviour (safe_exp, sigmoid, softmax helpers and `parse_categorical_crossentropy`) that the standalone script needs. Rather than wire up the real class, the LLM delegates the integration complexity to the user with 'For simplicity, let's assume you've copied it into this file or an adjacent one' and emits a 'Placeholder for where the Parser class definition would go' stub.
