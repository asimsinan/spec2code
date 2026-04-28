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

[... excerpt truncated ...] d shapes. Since we are not using external metadata files, we will have to make an assumption or require the user to ensure their ONNX model's input names match conventional names or that they update these names in the script.
3.  **Prepare Both Input Tensors:** The `preprocess_frame_for_vision_model` function (or a similar one) will need to prepare data for both `input_imgs` and `big_input_imgs`. For simplicity in this standalone script, we can often use the *same preprocessed image data* for both if the model was trained that way or is robust enough, but ideally, each would have its own specific preprocessing if their shapes or expected content differ.
4.  **Feed Both Inputs to `vision_session.run()`:** The dictionary passed to `vision_session.run()` must contain entries for all required input names. [... excerpt truncated ...]

## Why this is Complexity Avoidance

The ideal behaviour is explicitly stated ('ideally, each would have its own specific preprocessing if their shapes or expected content differ') and then immediately downgraded ('for simplicity in this standalone script, we can often use the same preprocessed image data for both'). Two inputs with potentially different shapes are collapsed into a single preprocessing path under an explicit 'for simplicity' qualifier.
