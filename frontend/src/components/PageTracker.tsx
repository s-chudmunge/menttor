'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '../lib/analytics';

interface PageTrackerProps {
  pageName?: string;
}

export default function PageTracker({ pageName }: PageTrackerProps) {
  const pathname = usePathname();
  
  useEffect(() => {
    const page = pageName || pathname.replace('/', '') || 'home';
    analytics.pageViewed(page, document.referrer);
  }, [pathname, pageName]);

  return null; // This component renders nothing
}