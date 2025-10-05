# Contributing to Tauri React Template

First off, thank you for considering contributing to this project! 🎉

This document provides guidelines and information for contributing to the Tauri React Template.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Commit Convention](#commit-convention)

## 📜 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

## 🤝 How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:

- Check if the issue already exists in our [issue tracker](https://github.com/Vishal-770/tauri-react-template/issues)
- Update to the latest version and see if the issue persists

When submitting a bug report, include:

- **Clear title** and description
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, etc.)
- **Screenshots** if applicable

### Suggesting Features

Feature requests are welcome! Before submitting:

- Check if the feature already exists or is planned
- Consider if it fits the project's scope and goals

Include in your feature request:

- **Clear description** of the feature
- **Use case** and motivation
- **Mockups or examples** if applicable

### Contributing Code

1. **Fork** the repository
2. **Create a feature branch** from `main`
3. **Make your changes**
4. **Add tests** if applicable
5. **Update documentation** if needed
6. **Submit a pull request**

## 🛠 Development Setup

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- Git

### Setup Steps

1. **Clone your fork**

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

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Layout/         # Layout components
│   └── Pages/          # Page components
├── lib/                # Utility functions
└── ...

src-tauri/
├── src/                # Rust source code
├── Cargo.toml          # Rust dependencies
└── tauri.conf.json     # Tauri configuration
```

## 🔄 Pull Request Process

1. **Update documentation** for any new features
2. **Add tests** for new functionality
3. **Ensure all tests pass** locally
4. **Follow the commit convention** (see below)
5. **Create descriptive PR title** and description
6. **Link related issues** in the PR description

### PR Title Format

Use conventional commit format:

```
feat: add new component
fix: resolve theme switching bug
docs: update installation guide
```

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] I have tested these changes locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)

[Add screenshots here]

## Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
```

## 🎨 Style Guidelines

### TypeScript/React

- Use **TypeScript** for all new code
- Follow **React Hooks** patterns
- Use **functional components** over class components
- Prefer **explicit types** over `any`

```typescript
// Good
interface UserProps {
  name: string;
  age: number;
}

const User: React.FC<UserProps> = ({ name, age }) => {
  return <div>{name} is {age} years old</div>;
};

// Avoid
const User = (props: any) => {
  return <div>{props.name} is {props.age} years old</div>;
};
```

### CSS/Styling

- Use **Tailwind CSS** utilities
- Follow **mobile-first** responsive design
- Use **CSS variables** for theming
- Prefer **semantic class names**

```tsx
// Good
<div className="flex flex-col md:flex-row gap-4 p-6">
  <Card className="flex-1">
    <CardContent>Content</CardContent>
  </Card>
</div>

// Avoid inline styles for complex layouts
<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
```

### Rust

- Follow **Rust naming conventions**
- Add **documentation comments** for public functions
- Handle **errors appropriately**
- Use **meaningful variable names**

```rust
/// Greets a user with a personalized message
#[tauri::command]
pub fn greet(name: &str) -> Result<String, String> {
    if name.is_empty() {
        return Err("Name cannot be empty".to_string());
    }
    Ok(format!("Hello, {}! Nice to meet you.", name))
}
```

## 📝 Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New features
- **fix**: Bug fixes
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or modifying tests
- **chore**: Build process or auxiliary tool changes
- **ci**: CI configuration changes

### Examples

```bash
feat: add dark mode toggle component
fix: resolve theme persistence issue
docs: update component usage examples
style: format code with prettier
refactor: extract theme logic to custom hook
test: add unit tests for theme provider
chore: update dependencies
```

### Scope (Optional)

```bash
feat(ui): add new button variant
fix(theme): resolve dark mode flash
docs(readme): update installation steps
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Include edge cases
- Test user interactions
- Mock external dependencies

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';
import { ModeToggle } from '../ModeToggle';

test('should toggle theme when clicked', () => {
  render(
    <ThemeProvider>
      <ModeToggle />
    </ThemeProvider>
  );

  const toggle = screen.getByRole('button');
  fireEvent.click(toggle);

  // Assert theme change
});
```

## 📚 Documentation

### Code Documentation

- Add JSDoc comments for complex functions
- Include examples in documentation
- Document component props with TypeScript interfaces

````typescript
/**
 * A reusable card component with optional header and footer
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content goes here</CardContent>
 * </Card>
 * ```
 */
interface CardProps {
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
}
````

### README Updates

When adding new features:

- Update the features list
- Add usage examples
- Update the tech stack if needed
- Include screenshots for UI changes

## ❓ Questions?

If you have questions about contributing:

1. Check existing [discussions](https://github.com/Vishal-770/tauri-react-template/discussions)
2. Create a new discussion
3. Join our community chat (if available)
4. Contact maintainers directly

## 🎉 Recognition

Contributors will be:

- Added to the contributors list
- Mentioned in release notes for significant contributions
- Given credit in documentation where appropriate

Thank you for contributing! 🚀
