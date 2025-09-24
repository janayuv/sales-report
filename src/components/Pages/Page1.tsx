import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Cpu,
  HardDrive,
  Monitor,
  Wifi,
  Database,
} from "lucide-react";
import { useTheme } from "../theme-provider";

const Page1 = () => {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleGreet = async () => {
    setIsLoading(true);
    try {
      const result = await invoke("greet", { name });
      setGreetMsg(result as string);
    } catch (error) {
      setGreetMsg("Error: Could not invoke Tauri command");
      console.error(error);
    }
    setIsLoading(false);
  };

  const systemInfo = [
    {
      label: "Operating System",
      value: "Windows 11",
      icon: <Monitor className="h-4 w-4" />,
    },
    { label: "Architecture", value: "x64", icon: <Cpu className="h-4 w-4" /> },
    {
      label: "Memory",
      value: "16 GB",
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      label: "Network",
      value: "Connected",
      icon: <Wifi className="h-4 w-4" />,
    },
  ];

  const features = [
    {
      title: "Tauri Commands",
      description: "Test backend communication",
      badge: "Rust",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Enter your name</Label>
            <Input
              id="name"
              placeholder="Type your name here..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGreet()}
            />
          </div>
          <Button
            onClick={handleGreet}
            disabled={!name.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? "Greeting..." : "Greet"}
          </Button>
          {greetMsg && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-mono">{greetMsg}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Theme System",
      description: "Dynamic theme switching",
      badge: "React",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Theme:</span>
            <Badge variant="outline">{theme}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("light")}
            >
              Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("dark")}
            >
              Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme("system")}
            >
              System
            </Button>
          </div>
          <div className="p-3 bg-primary/10 rounded-md">
            <p className="text-sm">
              Theme changes are persisted across sessions and apply instantly
              without page reload.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "System Information",
      description: "Platform detection",
      badge: "Tauri",
      content: (
        <div className="space-y-3">
          {systemInfo.map((info, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted/50 rounded"
            >
              <div className="flex items-center gap-2">
                {info.icon}
                <span className="text-sm font-medium">{info.label}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {info.value}
              </span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Terminal className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Interactive Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the key features of this Tauri + React template through
            interactive examples and live demonstrations.
          </p>
        </div>

        {/* Features Tabs */}
        <Tabs defaultValue="commands" className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="commands">Tauri Commands</TabsTrigger>
            <TabsTrigger value="theming">Theme System</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="commands" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {features[0].title}
                      <Badge variant="secondary">{features[0].badge}</Badge>
                    </CardTitle>
                    <CardDescription>{features[0].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>{features[0].content}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theming" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {features[1].title}
                      <Badge variant="secondary">{features[1].badge}</Badge>
                    </CardTitle>
                    <CardDescription>{features[1].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>{features[1].content}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {features[2].title}
                      <Badge variant="secondary">{features[2].badge}</Badge>
                    </CardTitle>
                    <CardDescription>{features[2].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>{features[2].content}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Info */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Frontend Stack</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• React 19 with TypeScript</li>
                    <li>• Tailwind CSS for styling</li>
                    <li>• shadcn/ui component library</li>
                    <li>• React Router for navigation</li>
                    <li>• React Query for state management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Backend Integration</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tauri commands for Rust ↔ JS communication</li>
                    <li>• Type-safe API calls with invoke()</li>
                    <li>• Native system access capabilities</li>
                    <li>• Secure context isolation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Page1;
