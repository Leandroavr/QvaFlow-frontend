/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'var(--qvaflow-primary)',
          hover: 'var(--qvaflow-primary-hover)',
          active: 'var(--qvaflow-primary-active)',
          subtle: 'var(--qvaflow-primary-subtle)',
          focus: 'var(--qvaflow-primary-focus)',
        },
        accent: {
          DEFAULT: 'var(--qvaflow-accent)',
          hover: 'var(--qvaflow-accent-hover)',
          subtle: 'var(--qvaflow-accent-subtle)',
        },
        surface: {
          page: 'var(--surface-page)',
          card: 'var(--surface-card)',
          sunken: 'var(--surface-sunken)',
          app: 'var(--surface-page)',
          subtle: 'var(--surface-sunken)',
          muted: 'var(--color-bg-muted)',
          elevated: 'var(--color-bg-elevated)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
          hover: 'var(--color-border-hover)',
          focus: 'var(--color-border-focus)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          border: 'var(--sidebar-border)',
          text: 'var(--sidebar-text)',
          'text-muted': 'var(--sidebar-text-muted)',
          hover: 'var(--sidebar-item-hover)',
          active: 'var(--sidebar-item-active)',
          'active-border': 'var(--sidebar-item-active-border)',
        },
        topbar: {
          bg: 'var(--topbar-bg)',
          border: 'var(--topbar-border)',
          text: 'var(--topbar-text)',
          'text-muted': 'var(--topbar-text-muted)',
          hover: 'var(--topbar-item-hover)',
          active: 'var(--topbar-item-active)',
        },
        state: {
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          'success-border': 'var(--color-success-border)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          'warning-border': 'var(--color-warning-border)',
          error: 'var(--color-error)',
          'error-bg': 'var(--color-error-bg)',
          'error-border': 'var(--color-error-border)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
          'info-border': 'var(--color-info-border)',
        },
        qvaflow: {
          navy: '#1E3A6B',
          'navy-dark': '#0F2347',
          'navy-light': '#2A5592',
          red: '#D62839',
          'red-dark': '#B81D2D',
          'red-light': '#E94655',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        card: 'var(--shadow-card)',
      },
      spacing: {
        18: '4.5rem',
      },
      minHeight: {
        12: '3rem', // 48px touch targets
      },
    },
  },
  plugins: [],
}
