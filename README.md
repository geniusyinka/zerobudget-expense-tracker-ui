# ZeroBudget Tracker

A modern, user-friendly budget tracking application built with Next.js, featuring real-time chat assistance and expense visualization.

## Features

- 🔐 Secure authentication
- 💰 Expense tracking and management
- 📊 Visual expense analytics with pie charts
- 🤖 AI-powered chatbot for budget assistance
- 🌓 Dark/Light theme support
- 📱 Responsive design for all devices

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [shadcn/ui](https://ui.shadcn.com/) - UI Components

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd zerobudget-tracker
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and configurations
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions
- `/public` - Static assets
- `/styles` - Global styles and Tailwind CSS configuration

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 