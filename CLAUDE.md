# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based web application called "astro-james" featuring educational and interactive tools including games, calculators, audio components, and text-to-speech functionality. The project uses a hybrid approach with both traditional components and Web Components.

## Development Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Build production site to ./dist/ |
| `npm run preview` | Preview build locally |
| `npm run test:ms` | Run Microsoft speech test |

## Architecture

### Core Structure
- **Pages**: Located in `src/pages/` - Each `.astro` file becomes a route
- **Components**: Mix of Astro components (.astro), React/Preact components (.tsx/.jsx), and Web Components (.ts)
- **Core Modules**: Business logic in `src/core/` organized by feature
- **Static Assets**: Extensive collection in `public/` including audio files, images, and fonts

### Key Patterns

**Web Components Architecture**: The project heavily uses custom Web Components with a consistent naming pattern `wc-*`. These are defined with shadow DOM and custom element registration, typically checking for browser environment:
```typescript
if (typeof window !== 'undefined')
  customElements.define('wc-component-name', class extends HTMLElement { ... })
```

**Feature-based Organization**: Each major feature has its own directory in `src/core/` with an `index.ts` entry point. Examples:
- `src/core/exam/` - Educational quiz system
- `src/core/talkers/` - Text-to-speech functionality
- `src/core/spinners/` - Interactive spinner components
- `src/core/dictionary/` - Dictionary lookup system

**Audio Integration**: Heavy use of audio functionality throughout the app with:
- Howler.js for audio playback
- Tone.js for music synthesis
- Custom audio components with reverb and looping capabilities
- AWS Polly and Microsoft Cognitive Services for TTS

### Technology Stack
- **Framework**: Astro 5.x with Preact integration
- **Styling**: PicoCSS as base, component-specific CSS files
- **TypeScript**: Strict configuration with path aliases (`@/*` → `./src/*`)
- **Audio**: Howler.js, Tone.js, VexFlow for music notation
- **AI Services**: OpenAI, Anthropic, AWS Polly, Microsoft Speech
- **Database**: Neon serverless PostgreSQL

### Component Conventions
- **Astro Components**: Use `.astro` extension, TypeScript frontmatter
- **React/Preact**: `.tsx` extension, Preact as JSX source
- **Web Components**: `.ts` extension with `wc-` prefix, shadow DOM usage
- **Styling**: Component-specific CSS files, often co-located

### API Routes
Located in `src/pages/api/` with various integrations:
- OpenAI text-to-speech and moderation
- AWS Polly speech synthesis
- Grok AI streaming responses
- Neon database operations

### Important Notes
- The project includes service worker functionality
- Supports PWA features with manifest.json
- Uses external scripts for evaluation (externalEval.js)
- Heavy multimedia content including audio files and images
- Educational focus with games, calculators, and learning tools