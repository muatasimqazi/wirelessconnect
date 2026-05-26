/**
 * LegalLayout — shared wrapper for all legal pages.
 *
 * Provides consistent heading, last-updated date, and prose container.
 * All legal pages use this to maintain a uniform structure.
 */

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
      </header>
      <div className="prose prose-neutral max-w-none text-foreground/90 [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6 [&_li]:mt-1 [&_p]:mt-4 [&_p:first-child]:mt-0">
        {children}
      </div>
    </div>
  );
}
