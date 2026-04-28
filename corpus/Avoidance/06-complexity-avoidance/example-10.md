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

[... excerpt truncated ...]  creation of the calibration window and trackbars.
        *   Update the console instructions for the first-frame calibration loop to include: "Press 't' to show/hide the Camera Calibration panel."
        *   In the loop, if 't' is pressed:
            *   If `not self.calibration_window_active`, call `self._create_calibration_panel()`.
            *   (For now, pressing 't' again won't hide it to keep things simpler, as hiding and recreating cleanly can be tricky with trackbar states. `cv2.destroyAllWindows()` at the end will handle cleanup.) [... excerpt truncated ...]

## Why this is Complexity Avoidance

The ideal UX (press 't' to toggle a calibration panel on and off) is reduced to a one-way show with the justification 'For now, pressing 't' again won't hide it to keep things simpler, as hiding and recreating cleanly can be tricky with trackbar states.' The tricky edge case is removed from the delivered surface.
