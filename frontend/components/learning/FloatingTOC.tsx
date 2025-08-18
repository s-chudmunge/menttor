import React, { useState, useEffect } from 'react';
import { LearningContent } from '../../types/learning';
import { BookOpen } from 'lucide-react';

interface Props {
  content: LearningContent;
}

const FloatingTOC: React.FC<Props> = ({ content }) => {
  const [activeId, setActiveId] = useState('');

  const headings = content.filter(block => block.type === 'heading');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    headings.forEach((heading, index) => {
      const slug = heading.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
      const id = `heading-${slug}`;
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [content]);

  return (
    <aside className="hidden lg:block w-64 sticky top-24 self-start flex-shrink-0">
        <div className="bg-gray-50 border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-300">
                <BookOpen className="w-4 h-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-800">Contents</h3>
            </div>
            <nav>
                <ul className="space-y-1">
                {headings.map((heading, index) => {
                    const slug = heading.data.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
                    const id = `heading-${slug}`;

                    const isActive = activeId === id;
                    return (
                    <li key={id}>
                        <a
                        href={`#${id}`}
                        className={`block py-2 px-3 text-sm transition-colors border-l-2 ${isActive ? 'bg-blue-50 text-blue-700 border-blue-500 font-medium' : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
                        onClick={(e) => {
                            e.preventDefault();
                            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        >
                        {heading.data.text}
                        </a>
                    </li>
                    );
                })}
                </ul>
            </nav>
        </div>
    </aside>
  );
};

export default FloatingTOC;