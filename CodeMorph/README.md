# CodeMorph

CodeMorph is a VS Code extension that converts code between languages automatically when you rename a file  
(e.g. renaming `Solution.java` → `Solution.py` converts the code instantly using AI).

---
## 🚧 Project Status

CodeMorph is currently in **early testing (pre-release)**.

The core conversion workflow is functional, but we are actively testing and improving:

- conversion accuracy  
- edge cases  
- UX clarity  
- performance  

Bugs, imperfect output, and rough edges are expected at this stage — and helpful 🙂

---

## ✨ Core Idea

Instead of copy-pasting code or running commands, CodeMorph treats **file renaming as intent**.

You rename a file → CodeMorph understands you want a language change → it converts the code for you.

Simple, fast, and native to your workflow.

---

## ✅ Supported Conversions (v1)

CodeMorph supports **strict, intentional language-to-language conversions**.  
Only explicitly allowed pairs are convertible.

### 🔁 Conversion Matrix

#### **General-Purpose Languages**
- **Python →** Java, JavaScript, TypeScript, C++, Go, Ruby, PHP, Bash, R, Lua, Perl
- **Java →** Python, Kotlin, C#
- **JavaScript →** TypeScript, Python, Dart
- **TypeScript →** JavaScript, Python
- **C →** C++
- **C++ →** C, Rust, Python
- **Go →** Python, Rust
- **Rust →** C++, Go
- **Kotlin →** Java
- **Dart →** JavaScript
- **Ruby →** Python
- **PHP →** Python

#### **Scripting / Automation**
- **Bash →** PowerShell, Python
- **PowerShell →** Bash
- **Lua →** Python
- **Perl →** Python
- **R →** Python

> ⚠️ If a language pair is not listed above, conversion is intentionally blocked to avoid unsafe or misleading output.

---

## 🆓 Free vs Pro Languages

CodeMorph uses **language-based access**, not feature crippling.

### 🆓 Free Languages
Conversions involving **only these languages** are available in the free version:

- Python  
- Java  
- JavaScript  
- TypeScript  
- C  
- C++  

