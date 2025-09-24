import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "./ModeToggle";
import { Menu, Github, ExternalLink } from "lucide-react";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Companies", href: "/companies" },
    { name: "Demo", href: "/page1" },
    { name: "Documentation", href: "/docs", external: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/tauri.svg" alt="Tauri" className="h-8 w-8 dark:invert" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Sales Report
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) =>
              item.external ? (
                <a
                  key={item.name}
                  href="#"
                  className="flex items-center space-x-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{item.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-foreground ${
                    isActive(item.href)
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com/Vishal-770/tauri-react-template"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            </Button>
            <ModeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ModeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <Link to="/" className="flex items-center space-x-2 mb-6">
                    <img
                      src="/tauri.svg"
                      alt="Tauri"
                      className="h-6 w-6 dark:invert"
                    />
                    <span className="text-lg font-bold">Sales Report</span>
                  </Link>

                  {navigation.map((item) =>
                    item.external ? (
                      <a
                        key={item.name}
                        href="#"
                        className="flex items-center justify-between py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <span>{item.name}</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`py-2 text-sm font-medium transition-colors hover:text-foreground ${
                          isActive(item.href)
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )
                  )}

                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a
                        href="https://github.com/Vishal-770/tauri-react-template"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4" />
                        View on GitHub
                      </a>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
