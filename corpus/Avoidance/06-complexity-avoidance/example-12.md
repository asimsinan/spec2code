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

Now I need to update the Header component to not use `next-intl` hooks since we're not providing the context. Let me create a simpler version that uses static text:

## Why this is Complexity Avoidance

The Header component needs `next-intl` but the i18n context is not provided. Rather than wire up the missing provider, the LLM proposes 'Let me create a simpler version that uses static text' — internationalisation is removed from the component rather than configured.
