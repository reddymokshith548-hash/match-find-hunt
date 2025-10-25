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
      href: "https://preview--match-find-hunt.lovable.app/about"
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

  // CHANGED: text-background is now text-foreground to make it visible
  return <footer className="text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <h3 className="text-2xl font-bold mb-4">
              Lexach
            </h3>
            {/* CHANGED: text-background/70 is now text-foreground/70 */}
            <p className="text-foreground/70 mb-6 leading-relaxed">Connecting entrepreneurs with their perfect co ❤️ founders. Build something amazing together.</p>
            <div className="flex gap-4">
              {/* CHANGED: bg-background/10 is now bg-foreground/10 (and hover) */}
              {socialLinks.map(social => <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-foreground/10 rounded-lg flex items-center justify-center hover:bg-foreground/20 transition-smooth" aria-label={social.label}>
                  <social.icon className="w-5 h-5" />
                </a>)}
            </div>
          </div>

          {/* Links */}
          {/* NOTE: These headings will correctly inherit text-foreground from the footer */}
          {Object.entries(footerLinks).map(([category, links]) => <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map(link => <li key={link.name}>
                    {/* CHANGED: text-background/70 is now text-foreground/70 (and hover) */}
                    <a href={link.href} className="text-foreground/70 hover:text-foreground transition-smooth text-sm">
                      {link.name}
                    </a>
                  </li>)}
              </ul>
            </div>)}
        </div>

        {/* CHANGED: border-background/20 is now border-foreground/20 */}
        <div className="border-t border-foreground/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          {/* CHANGED: text-background/60 is now text-foreground/60 */}
          <p className="text-foreground/60 text-sm">
            © 2024 Lexach. All rights reserved.
          </p>
          {/* CHANGED: text-background/60 is now text-foreground/60 */}
          <p className="text-foreground/60 text-sm flex items-center gap-1 mt-4 md:mt-0">
            Made with <Heart className="w-4 h-4 text-red-400 fill-current" /> for entrepreneurs
          </p>
        </div>
      </div>
    </footer>;
};

export default Footer;
