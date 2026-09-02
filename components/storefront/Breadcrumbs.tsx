import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velvetcrumbdemo.com';

  // Build Schema.org BreadcrumbList JSON-LD
  const schemaItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    ...items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 2,
      name: item.label,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: schemaItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center flex-wrap gap-1.5 text-xs text-[var(--text-muted)]">
          <li>
            <Link
              href="/"
              className="hover:text-[var(--accent-primary)] flex items-center gap-1 transition-colors"
              title="Home"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Home</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-[var(--accent-secondary)]/60 flex-shrink-0" />
                {isLast ? (
                  <span
                    className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-[var(--accent-primary)] transition-colors whitespace-nowrap"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
