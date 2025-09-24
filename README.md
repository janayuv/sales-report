# 🚀 Tauri + React + TypeScript Template

[![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A modern, production-ready template for building cross-platform desktop applications with **Tauri**, **React**, **TypeScript**, and **Tailwind CSS**. Features a beautiful UI, dark/light theme support, and all the tools you need to get started quickly.

![App Screenshot](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=Tauri+React+Template)

## ✨ Features

### 🎨 Modern UI & UX
- Beautiful, responsive design with **shadcn/ui** components
- **Dark/Light/System** theme support with no flash
- Mobile-first responsive design
- Professional navigation with mobile menu
- Modern hero section and feature showcase

### ⚡ Performance & Developer Experience
- **Lightning fast** with Tauri's Rust backend
- **Hot reload** development experience
- **Type-safe** communication between frontend and backend
- **Small bundle size** compared to Electron
- **Cross-platform** (Windows, macOS, Linux)

### 🛠 Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Tauri 2.0 (Rust)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router
- **State Management**: React Query
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4

### 🔧 Developer Tools
- ESLint & Prettier configuration
- TypeScript strict mode
- Path aliases (`@/` for `src/`)
- Component library ready
- Production build optimization

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **System dependencies** for your platform:
  - **Windows**: Microsoft Visual Studio C++ Build tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: Various packages (see [Tauri docs](https://tauri.app/v1/guides/getting-started/prerequisites))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vishal-770/tauri-react-template.git
   cd tauri-react-template
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## 📁 Project Structure

```
tauri-react-template/
├── public/                     # Static assets
│   ├── tauri.svg              # App icons
│   └── vite.svg
├── src/                       # Frontend source
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── Layout/           # Layout components
│   │   ├── Pages/            # Page components
│   │   ├── NavBar.tsx        # Navigation component
│   │   ├── Footer.tsx        # Footer component
│   │   ├── ModeToggle.tsx    # Theme toggle
│   │   └── theme-provider.tsx # Theme context
│   ├── lib/                  # Utility functions
│   │   └── utils.ts          # Common utilities
│   ├── App.tsx               # Router setup
│   ├── App.css               # Global styles & CSS variables
│   └── main.tsx              # App entry point
├── src-tauri/                 # Tauri backend
│   ├── src/                  # Rust source
│   │   ├── main.rs           # Main entry point
│   │   └── lib.rs            # Library functions
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri configuration
│   └── build.rs              # Build script
├── components.json            # shadcn/ui config
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite configuration
└── package.json              # Node.js dependencies
```

## 🎨 Customization

### Adding New Pages

1. Create a new component in `src/components/Pages/`
2. Add the route to `src/App.tsx`
3. Update navigation in `src/components/NavBar.tsx`

### Theme Customization

Edit the CSS variables in `src/App.css` to customize colors:

```css
.light {
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.516 0.149 265.725);
  /* ... more variables */
}

.dark {
  --background: oklch(0.141 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.92 0.004 286.32);
  /* ... more variables */
}
```

### Adding UI Components

Use shadcn/ui to add more components:

```bash
npx shadcn@latest add [component-name]
```

Available components: button, card, input, dropdown-menu, dialog, and [many more](https://ui.shadcn.com/docs/components).

## 🔧 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run tauri dev` | Start development server |
| `npm run tauri build` | Build for production |
| `npm run dev` | Start frontend dev server only |
| `npm run build` | Build frontend only |
| `npm run preview` | Preview production build |

### Adding Tauri Commands

1. **Add Rust function in `src-tauri/src/lib.rs`:**
   ```rust
   #[tauri::command]
   fn my_command(input: String) -> String {
       format!("Hello, {}!", input)
   }
   ```

2. **Register command in `src-tauri/src/main.rs`:**
   ```rust
   .invoke_handler(tauri::generate_handler![greet, my_command])
   ```

3. **Call from frontend:**
   ```typescript
   import { invoke } from '@tauri-apps/api/core';
   
   const result = await invoke('my_command', { input: 'World' });
   ```

## 🌟 Features in Detail

### Dark/Light Theme System
- Automatic system preference detection
- Persistent theme selection
- No flash of unstyled content (FOUC)
- Smooth transitions between themes

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Collapsible mobile navigation

### Type Safety
- Full TypeScript support
- Type-safe Tauri command invocation
- Strict mode enabled
- Path aliases for clean imports

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

If you find a bug or have a feature request:

1. **Search existing issues** to avoid duplicates
2. **Create a new issue** with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - System information (OS, Node.js version, etc.)

### Development Setup

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/tauri-react-template.git
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**

5. **Test thoroughly**

6. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

7. **Push and create a pull request**

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/modifications
- `chore:` Build process or auxiliary tool changes

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri Team](https://tauri.app/) for the amazing framework
- [React Team](https://react.dev/) for React
- [shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the icon library

## 📞 Support

- 📖 [Documentation](https://github.com/Vishal-770/tauri-react-template/wiki)
- 🐛 [Issue Tracker](https://github.com/Vishal-770/tauri-react-template/issues)
- 💬 [Discussions](https://github.com/Vishal-770/tauri-react-template/discussions)
- 📧 [Contact](https://www.linkedin.com/in/vishal-prabhu-130b1a323/)

---

<div align="center">

**[⭐ Star this repo](https://github.com/Vishal-770/tauri-react-template)** • **[🍴 Fork it](https://github.com/Vishal-770/tauri-react-template/fork)** • **[📝 Contribute](https://github.com/Vishal-770/tauri-react-template/blob/main/CONTRIBUTING.md)**

Made with ❤️ by [Vishal](https://github.com/Vishal-770) for the developer community

</div>
