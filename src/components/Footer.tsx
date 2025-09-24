import { Link } from "react-router-dom";
import { Github, Heart, ExternalLink } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    project: [
      { name: "Home", href: "/" },
      { name: "Demo", href: "/page1" },
      { name: "Documentation", href: "#", external: true },
      { name: "Changelog", href: "#", external: true },
    ],
    community: [
      {
        name: "GitHub",
        href: "https://github.com/Vishal-770/tauri-react-template",
        external: true,
      },
      {
        name: "Issues",
        href: "https://github.com/Vishal-770/tauri-react-template/issues",
        external: true,
      },
      {
        name: "Discussions",
        href: "https://github.com/Vishal-770/tauri-react-template/discussions",
        external: true,
      },
      {
        name: "Contributing",
        href: "https://github.com/Vishal-770/tauri-react-template/blob/main/CONTRIBUTING.md",
        external: true,
      },
    ],
    resources: [
      { name: "Tauri Docs", href: "https://tauri.app/", external: true },
      { name: "React Docs", href: "https://react.dev/", external: true },
      {
        name: "Tailwind CSS",
        href: "https://tailwindcss.com/",
        external: true,
      },
      { name: "shadcn/ui", href: "https://ui.shadcn.com/", external: true },
    ],
  };

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/tauri.svg"
                alt="Tauri"
                className="h-6 w-6 dark:invert"
              />
              <span className="text-lg font-bold">Tauri Template</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A modern template for building cross-platform desktop applications
              with Tauri and React.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/Vishal-770/tauri-react-template"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/vishal-prabhu-130b1a323/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Project Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Project</h3>
            <ul className="space-y-2">
              {links.project.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Community</h3>
            <ul className="space-y-2">
              {links.community.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4">Resources</h3>
            <ul className="space-y-2">
              {links.resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {link.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Tauri React Template. All rights reserved.
          </p>
          <div className="flex items-center text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 mx-1 text-red-500" />
            <span>by the community</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
