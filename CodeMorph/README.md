# CodeMorph

CodeMorph is a VS Code extension that converts code between languages automatically when you rename a file  
(e.g. renaming `Solution.java` → `Solution.py` converts the code instantly using AI).

---

## Project Status

**CodeMorph is no longer running.** Its hosted backend was shut down, the Claude API credits ran out, and the project had no active users, so it was retired. The code is kept as a reference.

The extension's built-in URLs in `src/config.ts` (`www.codemorph.me` and `codemorph-tbgv.onrender.com`) are offline, so sign-in and conversion will fail as shipped. To run it, start the proxy locally and point those constants at it. See the [Project status and local setup in the root README](../README.md#project-status).

---

## ✨ Core Idea

Instead of copy‑pasting code or running commands, CodeMorph treats **file renaming as intent**.

You rename a file → CodeMorph understands you want a language change → it converts the code for you.

Simple, fast, and native to your workflow.

---

## ✅ Supported Conversions (v1)

- Java ↔ Python  

(More languages planned in future versions.)