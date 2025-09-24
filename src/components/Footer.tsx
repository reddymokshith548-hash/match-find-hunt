import { Heart, Twitter, Linkedin, Github, Instagram } from "lucide-react";
const Footer = () => {
  const footerLinks = {
    Product: [{
      name: "How it Works",
      href: "#"
    }, {
      name: "Pricing",
      href: "#"
    }, {
      name: "Success Stories",
      href: "#"
    }, {
      name: "Community",
      href: "#"
    }],
    Company: [{
      name: "About Us",
      href: "#"
    }, {
      name: "Careers",
      href: "#"
    }, {
      name: "Blog",
      href: "#"
    }, {
      name: "Press",
      href: "#"
    }],
    Support: [{
      name: "Help Center",
      href: "#"
    }, {
      name: "Safety",
      href: "#"
    }, {
      name: "Contact Us",
      href: "#"
    }, {
      name: "Status",
      href: "#"
    }],
    Legal: [{
      name: "Privacy Policy",
      href: "#"
    }, {
      name: "Terms of Service",
      href: "#"
    }, {
      name: "Cookie Policy",
      href: "#"
    }, {
      name: "Guidelines",
      href: "#"
    }]
  };
  const socialLinks = [{
    icon: Twitter,
    href: "#",
    label: "Twitter"
  }, {
    icon: Linkedin,
    href: "#",
    label: "LinkedIn"
  }, {
    icon: Github,
    href: "#",
    label: "GitHub"
  }, {
    icon: Instagram,
    href: "https://www.instagram.com/____thechaoscrew?igsh=MWQzNTA2eTV0NHFxNA==",
    label: "Instagram"
  }];
  return <footer className="bg-foreground text-background">
      {/* Dark mode gradient overlay */}
      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-foreground dark:via-foreground/95 dark:to-primary/10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 relative z-10">
          {/* Brand */}
          <div className="col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              Find<span className="text-secondary">Baee</span>
            </h3>
            <p className="text-background/80 dark:text-background/90 mb-6 leading-relaxed">We match skills ! 
not star signs 💫 </p>
            <div className="flex gap-4">
              {socialLinks.map(social => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-background/10 rounded-lg flex items-center justify-center hover:bg-background/20 transition-smooth" aria-label={social.label}>
                  <social.icon className="w-5 h-5" />
                </a>)}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map(link => <li key={link.name}>
                    <a href={link.href} className="text-background/80 dark:text-background/90 hover:text-background transition-smooth text-sm">
                      {link.name}
                    </a>
                  </li>)}
              </ul>
            </div>)}
        </div>

        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center relative z-10">
          <p className="text-background/70 dark:text-background/80 text-sm">
            © 2024 FindBaee. All rights reserved.
          </p>
          <p className="text-background/70 dark:text-background/80 text-sm flex items-center gap-1 mt-4 md:mt-0">
            Made with <Heart className="w-4 h-4 text-red-400 fill-current" /> for entrepreneurs
          </p>
        </div>
      </div>
    </footer>;
};
export default Footer;