---
status: complete
date: 2026-06-02
slug: docker-webpack-build
---

# Docker Webpack Build

## Goal

Make the production Docker image build successfully on the QSB VPS after the source is pulled from GitHub.

## Context

The initial VPS Docker build failed during `npm run build` because Next.js 16 defaulted to Turbopack, but the Linux slim image only loaded WASM bindings. The build error recommended using Webpack for this platform.

## Plan

1. Keep the app's normal build script unchanged.
2. Force Webpack only in the Dockerfile build stage.
3. Commit and push the Dockerfile fix.
4. Rebuild and push the GHCR image from the VPS using the GitHub source.
