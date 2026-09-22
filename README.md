# 🎨 KalaSangam (कलासंगम)

> **Empowering Marginalized Artisans Through Multimodal Generative AI***

[![Expo](https://img.shields.io/badge/Expo-React%20Native-000020?logo=expo)](https://expo.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-E0234E?logo=nestjs)](https://nestjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

KalaSangam is an **AI-powered digital business platform** that enables rural and marginalized artisans to transform handcrafted products into professional digital catalogs using **voice, images, and Generative AI**.

The platform simplifies product onboarding, automates marketing content creation, recommends fair pricing, and connects artisans directly with retail and B2B buyers.

---

# 🌟 Problem Statement

Millions of Indian artisans produce exceptional handmade products but struggle with:

- Low digital literacy
- Poor product presentation
- Language barriers
- Lack of professional marketing
- Limited online visibility
- Unfair pricing

KalaSangam bridges this gap using **Multimodal AI**.

---

# ✨ Key Features

## 🎙️ Voice-First Smart Cataloging

- Speak naturally in Hindi or English
- Upload a single product photo
- Gemini extracts:
  - Product title
  - Category
  - Materials
  - Craft story
  - Product description
  - Tags

---

## 🖼️ AI Product Studio

Generate professional product assets from one image:

- Clean Background Removal
- 45° Isometric View
- Flat Lay View
- Macro Close-up

---

## 📢 AI Marketing Generator

Automatically creates:

- WhatsApp Posters
- Social Media Posters
- Product Caption
- Marketing Descriptions

---

## 💰 Fair Wage Pricing Engine

Transparent pricing based on:

- Raw materials
- Labour hours
- Minimum wages
- Profit margin

---

## 🔍 AI Semantic Marketplace

Powered by:

- PostgreSQL
- pgvector
- Vector Embeddings

Buyers can search naturally:

> "Handmade bamboo baskets under ₹1000"

instead of exact keyword matching.

---

## 📦 Order Management

Supports

- Retail Orders
- Wholesale Orders
- Order Tracking
- Delivery Status
- B2B Inquiries

---

# 🏗️ Architecture

```
kalasangam/
│
├── apps/
│   ├── backend/
│   └── mobile/
│
├── packages/
│   └── database/
│
└── README.md
```

---

# 🛠 Tech Stack

## Frontend

- Expo
- React Native
- Expo Router
- NativeWind
- TailwindCSS
- Zustand

## Backend

- NestJS
- Node.js
- TypeScript

## Database

- PostgreSQL
- Supabase
- Prisma ORM
- pgvector

## AI Stack

- Google Gemini 1.5 Flash
- Pollinations AI
- Stability AI
- Background Removal API

---

# 🗄 Database Overview

Core entities:

- Users
- Profiles
- Products
- Product Metadata
- Media
- Pricing
- Orders

Supported Roles:

- Artisan
- Buyer
- Admin

---

# 🚀 Getting Started

## Prerequisites

- Node.js 18+
- npm
- Expo Go
- Supabase Project

---

# Clone Repository

```bash
git clone https://github.com/revanth-432/SIH2026-Prototype.git

cd SIH2026-Prototype
```

---

# Install Dependencies

```bash
npm install
```

or

```bash
pnpm install
```

---

# Environment Variables

## Backend

Create

```
apps/backend/.env
```

```env
PORT=3000

DATABASE_URL=

DIRECT_URL=

SUPABASE_URL=

SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=

BG_REMOVAL_API_KEY=

STABLE_DIFFUSION_API_KEY=
```

---

## Mobile

Create

```
apps/mobile/.env
```

```env
EXPO_PUBLIC_API_URL=

EXPO_PUBLIC_SUPABASE_URL=

EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

# Database Setup

```bash
cd packages/database

npx prisma db push

npx prisma db seed
```

---

# Run Backend

```bash
cd apps/backend

npm install

npm run start:dev
```

Backend

```
http://localhost:3000/api
```

Swagger

```
http://localhost:3000/api/docs
```

---

# Run Mobile App

```bash
cd apps/mobile

npm install

npx expo start -c
```

Scan the QR code using **Expo Go**.

---

# 📱 User Flow

### Artisan

```
Register

↓

Capture Product

↓

Voice Description

↓

AI Processing

↓

Review Generated Catalog

↓

Generate Posters

↓

Publish

↓

Receive Orders
```

---

### Buyer

```
Browse Products

↓

AI Search

↓

View Product

↓

Place Order

↓

Track Order
```

---

---

# 🔮 Future Scope

- Regional Language Expansion
- ONDC Integration
- AI Sales Analytics
- Voice Commerce
- QR-Based Artisan Profiles
- AI Inventory Forecasting

---

# 👨‍💻 Team

**Team Name:** KalaSangam

### Members

- Revanth
- *(Add remaining team members)*

---

# 📄 License

This project is developed for **Smart India Hackathon (SIH)**.

```
MIT License
```

---

# ⭐ Support

If you like this project,

⭐ Star this repository.

---

> **KalaSangam — Preserving India's Craft Heritage through AI.**
