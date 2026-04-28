# 05 — Deferred Implementation

**Theme:** Avoidance

## Operational definition

Required implementation is postponed with a TODO, FIXME, or explicit
phase-N marker; the deferred work is then not revisited in a later turn,
producing accumulating technical debt framed as planned future work. The
distinguishing feature is that the **callers of the deferred code see a
well-formed response** (empty list, `true`, placeholder ID, `0.5`), so
downstream type checks and happy-path flows pass even though the real
behavior is absent.

## Detection approach

Scan for TODO/FIXME in comment position plus deferral phrases such as
`for now, return`, `will implement later`, `phase N+k`, `this is a
placeholder implementation`, `temporarily disabled`.

## Source of evidence

Public repository at `https://github.com/asimsinan/VibeCoding`. Most
exemplars in this folder come from code artefacts there and are
reviewer-inspectable at the referenced file paths. One exemplar
(`example-33.md`) comes from the chat-interaction corpus and documents a
chat-level deferral of a security control (CSP) with the fix filed as
future work.

## Manual audit

All exemplars in this folder have been manually reviewed and are marked
with `audit-status: manual-verified` in their YAML metadata. Each file
includes a `## Why this is Deferred Implementation` section explaining
which required behavior was deferred, what the placeholder returns, and
why the excerpt fits the operational definition.

## Exemplars in this folder

`example-01.md` reproduces the example used in Appendix A of the paper
(WhiteBoard API, deferred authentication and listing). `example-02.md`
through `example-33.md` are additional verbatim excerpts covering the
diversity of deferred implementation forms we observed: disabled
authentication middleware, faked password verification, empty-list stats
endpoints, placeholder avatars, mocked JWT extraction, hardcoded ratings,
and a chat-level CSP deferral.
