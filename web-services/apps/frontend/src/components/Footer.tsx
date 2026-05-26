import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaDiscord, FaGithub, FaXTwitter } from "react-icons/fa6";

function Footer() {
  const socialLinks = [
    {
      name: "Twitter",
      icon: FaXTwitter,
      href: "https://x.com/KrishAnand0103",
      color: "hover:text-blue-500",
    },
    {
      name: "Discord",
      icon: FaDiscord,
      href: "#",
      color: "hover:text-indigo-500",
    },
    {
      name: "GitHub",
      icon: FaGithub,
      href: "https://github.com/Official-Krish",
      color: "hover:text-zinc-700 dark:hover:text-gray-400",
    },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Rent VM", href: "/rent" },
        { name: "DePIN Hosting", href: "/hosting" },
        { name: "Pricing", href: "/pricing" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "/docs" },
        { name: "API Reference", href: "/api" },
        { name: "Tutorials", href: "/tutorials" },
        { name: "Status", href: "/status" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Careers", href: "/careers" },
        { name: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "GDPR", href: "/gdpr" },
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="py-16"
        >
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand section */}
            <motion.div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center rounded-full">
                  <img
                    src="/Logo.png"
                    alt="DeCloud Logo"
                    className="w-9 h-9 rounded-full"
                  />
                </div>
                <span className="text-xl font-bold">SolNet</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Decentralized cloud computing powered by Solana. Rent compute
                resources or earn SOL by sharing your hardware.
              </p>

              {/* Social links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.div
                    key={social.name}
                    whileHover="hover"
                    className="border border-zinc-200 dark:border-gray-800 rounded-full"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`transition-colors duration-200 ${social.color}`}
                      asChild
                    >
                      <a href={social.href} aria-label={social.name}>
                        <social.icon className="h-5 w-5" />
                      </a>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Footer links */}
            {footerLinks.map((section) => (
              <motion.div key={section.title}>
                <h3 className="font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Newsletter signup */}
          <motion.div className="border-t border-border pt-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold mb-2">Stay updated</h3>
                <p className="text-muted-foreground">
                  Get the latest updates on new features and network
                  improvements.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button className="whitespace-nowrap">Subscribe</Button>
              </div>
            </div>
          </motion.div>

          {/* Bottom section */}
          <motion.div className="border-t border-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 md:mb-0">
              <p className="text-muted-foreground text-sm">
                Built with ❤️ for the Solana community.
              </p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>© 2025 SolNet</span>
                <span>•</span>
                <span>All rights reserved</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 text-muted-foreground"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}
export default Footer;
