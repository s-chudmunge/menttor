import { Metadata } from 'next';

// Helper function to format title for metadata
function formatTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const title = formatTitle(params.slug);
  
  return {
    title: `${title} - Menttor Library`,
    description: `Learn about ${title.toLowerCase()} - comprehensive educational content from the Menttor Library.`,
    keywords: `${params.slug.replace(/-/g, ', ')}, deep learning, education, tutorial`,
  };
}

export default function DynamicLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}