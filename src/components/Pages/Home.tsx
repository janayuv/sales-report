import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Code,
  Zap,
  Shield,
  Smartphone,
  Globe,
  Download,
  Star,
  GitFork,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Lightning Fast',
      description:
        'Built with Rust backend for blazing fast performance and minimal resource usage.',
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure by Default',
      description:
        "Tauri's security-first approach ensures your app is protected from common vulnerabilities.",
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: 'Cross Platform',
      description:
        'Deploy to Windows, macOS, and Linux with a single codebase.',
    },
    {
      icon: <Code className="h-8 w-8" />,
      title: 'Modern Stack',
      description:
        'React 19, TypeScript, Tailwind CSS, and shadcn/ui for the best developer experience.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Web Technologies',
      description:
        'Use familiar web technologies to build native desktop applications.',
    },
    {
      icon: <Download className="h-8 w-8" />,
      title: 'Small Bundle Size',
      description:
        "Smaller app size compared to Electron, thanks to Tauri's Rust core.",
    },
  ];

  const techStack = [
    'Tauri 2.0',
    'React 19',
    'TypeScript',
    'Tailwind CSS',
    'shadcn/ui',
    'React Router',
    'React Query',
    'Vite',
    'Lucide Icons',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img
                src="/tauri.svg"
                alt="Tauri Logo"
                className="h-20 w-20 dark:invert"
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Tauri + React
              <span className="block text-primary">Template</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
              A modern, production-ready template for building cross-platform
              desktop applications with Tauri, React, TypeScript, and Tailwind
              CSS.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://github.com/Vishal-770/tauri-react-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">
                  GitHub Stars
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">
                  Contributors
                </div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-primary">1k+</div>
                <div className="text-sm text-muted-foreground">Downloads</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl font-bold text-primary">MIT</div>
                <div className="text-sm text-muted-foreground">License</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Why Choose This Template?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Everything you need to build modern desktop applications with the
              latest technologies.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-7xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3 text-primary">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Modern Tech Stack
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Built with the latest and greatest technologies for optimal
              performance and developer experience.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="flex flex-wrap justify-center gap-3">
              {techStack.map((tech, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-4 py-2 text-sm"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-24 sm:py-32 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Quick Start
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Get up and running in minutes with our simple setup process.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      1
                    </div>
                    <CardTitle>Clone & Install</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <code className="block bg-muted p-3 rounded text-sm">
                    git clone [repo-url]
                    <br />
                    cd tauri-react-template
                    <br />
                    npm install
                  </code>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      2
                    </div>
                    <CardTitle>Development</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <code className="block bg-muted p-3 rounded text-sm">
                    npm run tauri dev
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Starts the development server with hot reload.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      3
                    </div>
                    <CardTitle>Build & Deploy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <code className="block bg-muted p-3 rounded text-sm">
                    npm run tauri build
                  </code>
                  <p className="text-sm text-muted-foreground mt-2">
                    Creates production-ready binaries for your platform.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ready to Start Building?
            </h2>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Join thousands of developers who are building amazing desktop apps
              with this template.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link to="/page1" className="gap-2">
                  Explore Demo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="https://github.com/Vishal-770/tauri-react-template/fork"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <GitFork className="h-4 w-4" />
                  Fork Template
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
