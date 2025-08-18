import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors (blue/indigo)
        primary: {
          DEFAULT: '#4F46E5', // --primary-color
          light: '#A5B4FC',   // --primary-light
          dark: '#3730A3',    // --primary-dark
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Secondary color (cyan)
        secondary: {
          DEFAULT: '#06B6D4', // --secondary-color
        },
        // Accent color (orange)
        accent: {
          DEFAULT: '#F59E0B', // --accent-color
        },
        // Success color (green, from old accent)
        success: {
          DEFAULT: '#10B981', // --success-color
        },
        // Warning color (orange, same as accent)
        warning: {
          DEFAULT: '#F59E0B', // --warning-color
        },
        // Error color (red)
        error: {
          DEFAULT: '#EF4444', // --error-color
        },
        // Background colors
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-dark': 'var(--bg-dark)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-light': 'var(--text-light)',

        // Border colors
        'border-color': 'var(--border-color)',
        'border-hover': 'var(--border-hover)',

        // Existing gray shades (keep for compatibility)
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // Add custom spacing for better content layout
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography')({
      css: {
        // Base prose styles with better spacing
        maxWidth: 'none', // Remove max-width constraint
        
        // CSS Variables for consistent theming
        '--tw-prose-body': 'var(--text-primary)',
        '--tw-prose-headings': 'var(--text-primary)',
        '--tw-prose-lead': 'var(--text-secondary)',
        '--tw-prose-links': 'var(--primary-color)',
        '--tw-prose-bold': 'var(--text-primary)',
        '--tw-prose-counters': 'var(--text-secondary)',
        '--tw-prose-bullets': 'var(--text-secondary)',
        '--tw-prose-hr': 'var(--border-color)',
        '--tw-prose-quotes': 'var(--text-primary)',
        '--tw-prose-quote-borders': 'var(--border-color)',
        '--tw-prose-captions': 'var(--text-muted)',
        '--tw-prose-code': 'var(--primary-dark)',
        '--tw-prose-pre-code': '#E2E8F0',
        '--tw-prose-pre-bg': 'var(--bg-dark)',
        '--tw-prose-th-borders': 'var(--border-color)',
        '--tw-prose-td-borders': 'var(--border-color)',

        // Improved typography with better spacing
        'h1': {
          fontSize: '2.5rem',
          fontWeight: '800',
          color: 'var(--text-primary)',
          marginTop: '0',
          marginBottom: '2rem',
          lineHeight: '1.2',
          letterSpacing: '-0.025em',
        },
        
        'h2': {
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginTop: '3rem',
          marginBottom: '1.5rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-color)',
          position: 'relative',
          lineHeight: '1.3',
          '&:first-child': {
            marginTop: '0',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: '-1px',
            left: '0',
            width: '3rem',
            height: '2px',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
            borderRadius: '1px',
          },
        },
        
        'h3': {
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--primary-color)',
          marginTop: '2.5rem',
          marginBottom: '1rem',
          lineHeight: '1.4',
          '&:first-child': {
            marginTop: '0',
          },
        },
        
        'h4': {
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginTop: '2rem',
          marginBottom: '0.75rem',
          lineHeight: '1.4',
        },
        
        'p': {
          marginTop: '0',
          marginBottom: '1.5rem',
          lineHeight: '1.7',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          '&:last-child': {
            marginBottom: '0',
          },
        },
        
        'ul, ol': {
          marginTop: '1.5rem',
          marginBottom: '1.5rem',
          paddingLeft: '1.75rem',
        },
        
        'li': {
          marginTop: '0.5rem',
          marginBottom: '0.5rem',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
          '&:first-child': {
            marginTop: '0',
          },
          '&:last-child': {
            marginBottom: '0',
          },
        },
        
        'li > p': {
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        },
        
        // Better nested list spacing
        'li > ul, li > ol': {
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        },
        
        // Improved strong/bold text
        'strong': {
          color: 'var(--text-primary)',
          fontWeight: '600',
        },
        
        'em': {
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
        },
        
        // Superscript and subscript
        'sup, sub': {
          fontSize: '0.75em',
          lineHeight: '0',
          position: 'relative',
          verticalAlign: 'baseline',
        },
        
        'sup': {
          top: '-0.5em',
        },
        
        'sub': {
          bottom: '-0.25em',
        },
        
        // Improved tables
        'table': {
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '2rem',
          marginBottom: '2rem',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          border: '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
        },
        
        'thead': {
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '2px solid var(--border-color)',
        },
        
        'th': {
          padding: '1rem',
          textAlign: 'left',
          fontWeight: '600',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          letterSpacing: '0.025em',
        },
        
        'tbody tr': {
          borderBottom: '1px solid var(--border-color)',
          '&:hover': {
            backgroundColor: 'var(--bg-tertiary)',
          },
          '&:last-child': {
            borderBottom: 'none',
          },
        },
        
        'td': {
          padding: '1rem',
          verticalAlign: 'top',
          color: 'var(--text-secondary)',
        },
        
        // Better blockquotes
        'blockquote': {
          borderLeft: '4px solid var(--primary-color)',
          paddingLeft: '1.5rem',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
          fontStyle: 'italic',
          color: 'var(--text-secondary)',
          margin: '2rem 0',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '0 0.5rem 0.5rem 0',
        },
        
        // Improved inline code
        'code': {
          background: 'var(--bg-tertiary)',
          color: 'var(--primary-dark)',
          padding: '0.25rem 0.5rem',
          borderRadius: '0.375rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875em',
          fontWeight: '500',
          border: '1px solid var(--border-color)',
        },
        
        // Better code blocks
        'pre': {
          background: 'var(--bg-dark)',
          color: '#E2E8F0',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          overflowX: 'auto',
          margin: '2rem 0',
          border: '1px solid var(--border-color)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          
          'code': {
            background: 'transparent',
            color: 'inherit',
            padding: '0',
            borderRadius: '0',
            border: 'none',
            fontSize: 'inherit',
          },
        },
        
        // Horizontal rules
        'hr': {
          border: 'none',
          borderTop: '1px solid var(--border-color)',
          margin: '3rem 0',
        },

        // Dark mode overrides
        '.dark &': {
          '--tw-prose-body': 'var(--text-primary)',
          '--tw-prose-headings': 'var(--text-primary)',
          '--tw-prose-lead': 'var(--text-secondary)',
          '--tw-prose-links': 'var(--primary-light)',
          '--tw-prose-bold': 'var(--text-primary)',
          '--tw-prose-counters': 'var(--text-secondary)',
          '--tw-prose-bullets': 'var(--text-secondary)',
          '--tw-prose-hr': 'var(--border-color)',
          '--tw-prose-quotes': 'var(--text-primary)',
          '--tw-prose-quote-borders': 'var(--border-color)',
          '--tw-prose-captions': 'var(--text-muted)',
          '--tw-prose-code': 'var(--primary-light)',
          '--tw-prose-pre-code': 'var(--text-light)',
          '--tw-prose-pre-bg': 'var(--bg-secondary)',
          '--tw-prose-th-borders': 'var(--border-color)',
          '--tw-prose-td-borders': 'var(--border-color)',
        },
      },
    }),
  ],
};

export default config;