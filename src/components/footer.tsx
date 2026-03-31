import Link from 'next/link'

const footerLinks = {
  Product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  Company: [
    { name: 'PeeTeeAI', href: 'https://peeteeai.com' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
  ],
  Legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
  Ecosystem: [
    { name: 'FocusFlow AI', href: 'https://focusflow.peeteeai.com' },
    { name: 'HabitOS AI', href: 'https://habitos.peeteeai.com' },
    { name: 'BreathMaster AI', href: 'https://breathmaster.peeteeai.com' },
    { name: 'MemoryForge AI', href: 'https://memoryforge.peeteeai.com' },
    { name: 'HarmonyMap AI', href: 'https://harmonymap.peeteeai.com' },
    { name: 'SeeneyU', href: 'https://seeneyu.com' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-emerald-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-4">
                {category}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith('http') ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                H
              </div>
              <div>
                <span className="text-white font-semibold">HabitOS AI</span>
                <p className="text-gray-500 text-xs">
                  A PeeTeeAI Product &middot; Part of the HumanOS Ecosystem
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} PeeTeeAI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
