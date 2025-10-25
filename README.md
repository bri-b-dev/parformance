# ParFormance

A modern, mobile‑first application built with Vue 3, Vite, and Capacitor for the web, Android, and iOS. The project structure and tooling make it easy to develop, build, and ship cross‑platform apps.

<!-- Badges -->
<p align="left">
  <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A520.19%20|%20%E2%89%A522.12-3C873A?logo=node.js&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img alt="Vue" src="https://img.shields.io/badge/Vue-3-42B883?logo=vuedotjs&logoColor=white" />
  <img alt="Capacitor" src="https://img.shields.io/badge/Capacitor-7-119EFF?logo=capacitor&logoColor=white" />
  <img alt="Platforms" src="https://img.shields.io/badge/Platforms-Web%20|%20Android%20|%20iOS-0A0A0A" />
  <a href="https://github.com/bri-b-dev/parformance/actions/workflows/release.yaml">
    <img alt="CI" src="https://img.shields.io/github/actions/workflow/status/parformance/actions/release.yaml?branch=main&label=release%20CI&logo=github" />
  </a>
  <a href="https://github.com/bri-b-dev/parformance/actions/workflows/test.yml">
    <img alt="Tests CI" src="https://img.shields.io/github/actions/workflow/status/bri-b-dev/parformance/test.yml?branch=main&label=tests%20CI&logo=github" />
  </a>
</p>

## Table of contents
* [Table of contents](#table-of-contents)
* [About](#about)
* [Features](#features)
* [Tech stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Getting started](#getting-started)
* [Scripts](#scripts)
* [Configuration](#configuration)
* [Development](#development)
* [Building for production](#building-for-production)
* [Running on mobile (Capacitor)](#running-on-mobile-capacitor)
* [Project structure](#project-structure)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)

## About
ParFormance is a cross‑platform app built with Vue 3 and Capacitor. It targets the web, Android, and iOS from a single codebase. Use this repository as a starting point for rapid development with modern tooling.

## Features
- Vue 3 application scaffolded with Vite for fast DX
- Capacitor 7 for native Android and iOS integration
- Pinia for state management and Vue Router for navigation
- Ready‑to‑use scripts for development, build, and preview
- Dockerfile for static hosting with NGINX

## Tech stack
- Vue 3
- Vite 6
- Capacitor 7 (Android and iOS)
- Pinia, Vue Router

## Prerequisites
- Node.js: >= 20.19 or >= 22.12 (as defined in package.json engines)
- npm (comes with Node.js) or another package manager
- Git
- For Android builds: Android Studio, Android SDK, and Java JDK 17
- For iOS builds (macOS only): Xcode and CocoaPods
- Optional for Docker:
    - Docker Engine 24+

Verify your versions:
- node -v
- npm -v
- java -version (for Android)

## Getting started
1. Clone the repository
   - git clone https://github.com/bri-b-dev/parformance.git
   - cd parformance
2. Install dependencies
   - npm install
3. Start the development server
   - npm run dev
4. Open the app
   - The dev server URL will be shown in the terminal (typically http://localhost:5173)

## Scripts
The following scripts are available in package.json:
- npm run dev: Start the Vite development server
- npm run build: Build the production bundle to dist/
- npm run preview: Preview the production build locally
- npm run test: Placeholder; returns success until tests are added
- npm run lint: Placeholder; returns success until linters are configured
- npm run validate:drills: Validate drills JSON schema (src/data/drills.json)

## Configuration
- Capacitor: capacitor.config.json
  - appId: com.bribdev.parformance
  - appName: ParFormance
  - webDir: dist
- Vite environment variables
  - Create .env, .env.development, or .env.production at the project root
  - Prefix variables with VITE_ to expose them to client code (for example, VITE_API_URL)

## Development
- Web development
  - npm run dev
  - Edit files in src/; HMR will update the browser automatically.
- Code style and tooling
  - This project uses modern ESM and Vite. Add your preferred linters/formatters as needed.

## Building for production
- Create optimized production assets in dist/
  - npm run build
- Preview the build locally
  - npm run preview

## Running on mobile (Capacitor)
Capacitor bridges the web app to native platforms.

Initial platform setup (run once per platform):
- Android
  - npx cap add android
- iOS (macOS only)
  - npx cap add ios

Each time you change web code and want to run natively:
1. Build the web app
   - npm run build
2. Sync web assets and native plugins
   - npx cap sync
3. Open the native IDE to run on device or emulator
   - Android Studio: npx cap open android
   - Xcode: npx cap open ios

You can also run directly from the IDE and manage signing, emulators, and devices there.

## Docker usage
Build a production image:
- docker build -t handycap:latest .

Run the container (serves dist/ via NGINX):
- docker run --rm -p 8080:80 handycap:latest

Then open http://localhost:8080

## Project structure
- src: Application source code (Vue components, stores, router, etc.)
- public: Static assets copied as‑is to the root of the build
- dist: Production build output (generated)
- android, ios: Native platform projects managed by Capacitor
- resources, icons: App icons and splashes (for Capacitor assets)
- vite.config.js: Vite configuration
- capacitor.config.json: Capacitor configuration

## Troubleshooting
- Node version errors
  - Ensure Node.js version matches engines in package.json (>=20.19 or >=22.12).
- Android build issues
  - Use JDK 17 and ensure ANDROID_HOME/SDK paths are configured in your environment.
  - Open the android project in Android Studio and let it sync Gradle.
- iOS build issues
  - Run pod install inside ios/ if CocoaPods are used.
  - Open the ios project in Xcode and select a valid signing team.
- Capacitor platform missing
  - If you do not see android/ or ios/, run npx cap add <platform>.
- Web assets not updating in native app
  - After changes, run npm run build && npx cap sync before opening the native IDE.

## Contributing
Issues and pull requests are welcome. Please open an issue to discuss changes before submitting a PR.

- Contribution guide: see [CONTRIBUTING.md](./CONTRIBUTING.md)
- Data model overview: see [docs/DATA_MODEL.md](./docs/DATA_MODEL.md)
- App workflows (List, Detail, Shuffle, Start→Save→History, Stats): see [docs/WORKFLOWS.md](./docs/WORKFLOWS.md)
- How to add a drill: covered in [CONTRIBUTING.md#how-to-add-a-drill-content-contribution](./CONTRIBUTING.md#how-to-add-a-drill-content-contribution)

## License
This project is licensed under the Apache License, Version 2.0.

- See the LICENSE file at the repository root.
- You may also obtain a copy at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.


## Storybook
- Run component workshop: npm run storybook (opens at http://localhost:6006)
- Build static Storybook: npm run build-storybook (outputs to storybook-static/)
- CI: Storybook build runs on push/PR via .github/workflows/storybook.yml
