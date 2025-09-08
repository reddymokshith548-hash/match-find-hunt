import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="fixed top-6 right-6 z-50 bg-background/80 backdrop-blur-sm border border-border rounded-full p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
      <div className="flex items-center space-x-3">
        <Sun className={`h-4 w-4 transition-all duration-300 ${isDark ? 'text-muted-foreground scale-90' : 'text-yellow-500 scale-100'}`} />
        <Switch
          checked={isDark}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 transition-all duration-300"
        />
        <Moon className={`h-4 w-4 transition-all duration-300 ${isDark ? 'text-blue-400 scale-100' : 'text-muted-foreground scale-90'}`} />
      </div>
    </div>
  );
}