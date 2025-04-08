# SmartOne ERP

A comprehensive ERP system built with Next.js 15.2.4, TypeScript, and modern web technologies.

## Features

- 🎯 Customer Service Management
- 📦 Order Management
- 🏭 Production Tracking
- 💰 Finance Management
- ✅ Production Approvals
- 🔐 Role-Based Access Control (RBAC)

## Tech Stack

- **Framework:** Next.js 15.2.4 (App Router)
- **Language:** TypeScript
- **UI Components:** Shadcn UI, Radix UI
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL
- **Package Manager:** pnpm

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- pnpm
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartone_erp.git
   cd smartone_erp
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration.

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
smartone_erp/
├── app/                 # Next.js app directory
├── components/          # Reusable components
├── lib/                 # Utility functions
├── types/              # TypeScript type definitions
└── public/             # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
