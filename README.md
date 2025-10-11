<!--<p align="center">
  <img src="./assets/cleancodekit-logo.png" alt="cleancodekit logo" width="200"/>
</p>-->

# 🧼 cleancodekit

<!-- Project Metadata -->
![version](https://img.shields.io/badge/version-0.0.1-blue?style=flat-square)
![License](https://img.shields.io/github/license/demingongo/cleancodekit?style=flat-square)
![Issues](https://img.shields.io/github/issues/demingongo/cleancodekit?style=flat-square)

<!-- Tooling Support -->
![Generates ESLint Config](https://img.shields.io/badge/generates-ESLint_Config-4B32C3?style=flat-square&logo=eslint&logoColor=white)
![Supports Prettier](https://img.shields.io/badge/supports-Prettier-ff69b4?style=flat-square&logo=prettier&logoColor=white)
![Includes Husky Setup](https://img.shields.io/badge/includes-Husky_Setup-8E44AD?style=flat-square&logo=git&logoColor=white)
![Configures lint-staged](https://img.shields.io/badge/configures-lint--staged-FF5733?style=flat-square&logo=git&logoColor=white)

**Your one-stop setup tool for clean, consistent, and professional codebases.**  
Automates the installation and configuration of ESLint, Prettier, Husky, and more—so you can focus on writing great code, not fiddling with configs.

---

## 🚀 Features

- 📦 Installs essential dev dependencies:
  - ESLint
  - Prettier
  - Husky
  - Lint-staged
- 🛠️ Generates ready-to-use config files
  - `eslint.config.mjs`
  - `lint-staged.config.mts`
  - `prettier.config.mts`
  - `.husky/` hooks
- 🔄 Sets up Git hooks for pre-commit linting
- 🧪 Supports multiple environments (Node, React, TypeScript, etc.)
- 🧘 Opinionated defaults with flexibility to customize

---

## 📦 Installation

```bash
npx git+https://github.com/demingongo/cleancodekit
```

This command will:
1. Install all required dependencies
2. Create config files in your project root
3. Set up Husky pre-commit hooks
4. Optionally detect your tech stack and tailor configs

---

## 🧩 Supported Stacks

- JavaScript / TypeScript
- Node.js
- React (coming soon)

---

## 📝 Example Output

After running `cleancodekit`, your project will include:

```
.husky/
.vscode/
.env.format
.prettierignore
eslint.config.mjs
lint-staged.config.mts
prettier.config.mts
```

---

## 📄 License

MIT
