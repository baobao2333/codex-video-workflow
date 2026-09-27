# Creating videos with this repository

When asked to make a video, read `CODEX-VIDEO-WORKFLOW.md`, `PROMPT-TEMPLATE.md`, `MUSIC.md`, and `REFERENCE-STUDY.md` first. Treat them as a production method, not a requirement to use every tool mentioned.

- Identify the audience, one concrete claim, and the intended viewing context. Reuse information the user has already supplied.
- Study the actual reference content available to you. Distinguish source-code evidence, still-frame observations, complete motion review, and listening review.
- Compare three narrative mechanisms. Choose a direction when the brief is clear; do not add unnecessary approval stops.
- Test product relevance, composition, subject detail, material, camera, motion, rhythm, and sound. A continuous transition alone does not fix a slide-like film.
- Render actual style frames and a representative motion proof before committing to the complete production.
- Use frame-addressable animation and an explicit cue map. Keep picture, music, Foley, and narration replaceable.
- Music defaults to local procedural composition. Adapt `score.py` for the brief. Suno is optional; account, subscription, model, credit, or download limitations should not block a video unless the user explicitly requires that source. Record every fallback truthfully.
- Keep the existing examples intact. Put a new film and its treatment, source, assets, audio, preview, final video, and verification records in its own directory.
- Verify actual output proportionally. Never equate successful encoding with good design or claim a human listening review you did not perform.
- Deliver a playable MP4 and reproducible source. Publishing or purchasing requires the user's authorization; prior authorization remains valid.

Example commands: root `python build.py` rebuilds the Canvas example with local music; `python -m unittest test_music.py` checks music selection and fallback. The optional Three.js product film has separate instructions in `promo/README.md`.
