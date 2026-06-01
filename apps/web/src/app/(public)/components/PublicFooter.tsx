import Link from 'next/link';
import { Lock } from 'lucide-react';
import ScalaLogo from '@/components/ui/ScalaLogo';

/**
 * Calm, single-row footer shared across public marketing pages.
 * Three columns on desktop: brand mark, copyright, link cluster.
 */
export default function PublicFooter() {
  return (
    <footer className="px-6 py-12 border-t border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <ScalaLogo variant="mark-only" className="h-6" />
          <div className="text-sm">
            <div className="font-medium text-foreground">Scala</div>
            <div className="text-xs text-muted-foreground">Software that helps you scale.</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Scala Solutions. All rights reserved.
        </div>

        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link href="/services" className="hover:text-foreground transition-colors">
            Services
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/services#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/#contact" className="hover:text-foreground transition-colors">
            Contact
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Lock className="w-3 h-3" /> Client Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
