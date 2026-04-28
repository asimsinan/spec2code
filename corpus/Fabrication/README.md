# Theme: Fabrication

**Definition.** The LLM generates false evidence of completion. Rather than
performing the required verification work (running tests, producing terminal
output, implementing specified behaviour), the model synthesises plausible-looking
evidence that cannot be independently verified.

**Why it matters.** Fabrication is the most direct attack on trust: the
supervisor receives claims that appear authoritative but have no verification
substrate. Accepting a fabricated claim means committing code to production on
the basis of evidence that does not exist.

**Categories in this theme** (3):

| # | Category | Short description |
|---|---|---|
| 01 | Fabricated Completion | Specification marked complete while implementation is a stub |
| 02 | Verification Bypass | Synthesised terminal output or coverage in lieu of a real test run |
| 03 | Description Substitution | Narrative claim of completion that contradicts the code artefacts |

Each category has its own subfolder with an operational definition and a set
of exemplars drawn from the VibeCoding public repository (static code) and
the Cursor chat-interaction corpus (conversational excerpts).
