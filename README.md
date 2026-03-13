<!-- README.md -->

<div align="center">

# ✈️ Fly Bismillah

### Modern B2C Online Travel Agency Platform

Real-time global flight search · Automated booking · Hold & Pay Later · Instant ticket issuance

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![Duffel](https://img.shields.io/badge/Duffel-API-purple)](https://duffel.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payment-blueviolet?logo=stripe)](https://stripe.com/)
[![Resend](https://img.shields.io/badge/Resend-Email-orange)](https://resend.com/)
[![License](https://img.shields.io/badge/License-Private-red)](#)
[![Status](https://img.shields.io/badge/Status-v2.0-brightgreen)](#)

<br/>

| ✈️ 500+ Airlines | ⚡ Real-time Data | 🤖 100% Automated | 🔐 Secure Webhooks |
|:-:|:-:|:-:|:-:|

<br/>

[Live Site](https://flybismillah.com) · [Documentation](#-documentation) · [Installation](#-quick-start) · [Roadmap](#-roadmap)

</div>

---

## 📖 About

**Fly Bismillah** is a production-grade **B2C online travel agency** platform built with **Next.js 14 (App Router)**. It connects to the **Duffel API** for access to **500+ airlines worldwide** and handles the entire flight booking lifecycle — from search to e-ticket delivery — with **zero manual intervention**.

> **B2C Platform:** End users search and book flights directly. Admins manage bookings, pricing markup and ticket issuance from the admin dashboard.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔍 **Real-time Flight Search** | One-way, round-trip & multi-city with smart filters |
| 🎫 **Hold Booking (Pay Later)** | Reserve seats without immediate payment |
| 💳 **Stripe Payment** | Secure card payments with 3D Secure (SCA) |
| ✅ **Instant Ticket Issuance** | Auto-issue after payment confirmation |
| 📧 **Automated Emails** | Booking confirmation, e-tickets, reminders via Resend |
| 🔔 **Webhook Processing** | Real-time updates from Duffel & Stripe |
| 🛡️ **Admin Dashboard** | Full booking management, staff accounts, analytics |
| 🖥️ **CLI Tool** | Windows batch script for server & admin management |

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Server Components, Middleware, JWT Auth |
| **Database** | MongoDB Atlas, Mongoose ODM, Indexed queries |
| **Flight Engine** | Duffel API (500+ airlines worldwide) |
| **Payments** | Stripe (Cards, 3D Secure) |
| **Email** | Resend + React Email templates |
| **Auth** | JWT, NextAuth.js, Bcrypt (12 rounds) |
| **Deployment** | Vercel Edge, GitHub CI/CD |
| **Security** | HMAC-SHA256, AES-256 encryption, CORS, Rate limiting |

---

## ⚡ Quick Start

### Prerequisites

| Requirement | Version | Note |
|-------------|---------|------|
| Node.js | v18+ | LTS recommended |
| pnpm / npm | Latest | pnpm preferred |
| MongoDB | Atlas | Cloud database |
| Git | Latest | Version control |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/fly-bismillah.git
cd fly-bismillah

# 2. Install dependencies
pnpm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Fill in your environment variables (see Environment Setup below)

# 5. Run development server
pnpm dev