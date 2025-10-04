import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, Settings, Search, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuthRouting } from "@/hooks/useAuthRouting";

const Navigation = () => {
  const { handleGetStarted } = useAuthRouting();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: "Find Co-founders", href: "#", icon: Search },
    { name: "About Us", href: "/about", icon: Users },
    { name: "Matches", href: "#", icon: Users },
    { name: "Messages", href: "#", icon: MessageCircle },
    { name: "Profile", href: "#", icon: Settings },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold gradient-text hover-3d cursor-pointer">
              FindBaee
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <a
                key={item.name}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2 hover-3d group relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform group-hover:text-primary" />
                <span className="relative">
                  {item.name}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-primary group-hover:w-full transition-all duration-300" />
                </span>
              </a>
            ))}
            <ThemeToggle />
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="hover-tilt" onClick={() => navigate('/login')}>Sign In</Button>
            <Button 
              variant="hero" 
              size="sm" 
              className="hover-3d animate-pulse-glow" 
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover-3d"
            >
              {isMenuOpen ? <X className="w-5 h-5 animate-scale-pulse" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col space-y-3">
              {navItems.map((item, index) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-smooth flex items-center gap-2 px-2 py-2 hover-3d group opacity-0 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'forwards' }}
                >
                  <item.icon className="w-4 h-4 group-hover:text-primary transition-colors" />
                  {item.name}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-4 opacity-0 animate-slide-up" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                <div className="flex justify-center mb-2">
                  <ThemeToggle />
                </div>
                <Button variant="ghost" className="justify-start hover-tilt" onClick={() => navigate('/login')}>Sign In</Button>
                <Button 
                  variant="hero" 
                  size="sm" 
                  className="hover-3d animate-pulse-glow" 
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;