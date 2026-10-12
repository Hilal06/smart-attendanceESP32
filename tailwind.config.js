/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.ts",
        "./resources/**/*.tsx",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "var(--color-primary)",
                    hover: "var(--color-primary-hover)",
                    light: "var(--color-primary-light)",
                    text: "var(--color-primary-text)",
                    accent: "var(--color-accent)",
                },
                indigo: {
                    50: "var(--color-primary-light)",
                    100: "var(--color-primary-light)",
                    200: "var(--color-primary-light)",
                    300: "var(--color-accent)",
                    400: "var(--color-primary-text-dark)",
                    500: "var(--color-primary)",
                    600: "var(--color-primary)",
                    700: "var(--color-primary-hover)",
                    800: "var(--color-primary-hover)",
                    900: "var(--color-primary-text)",
                    950: "var(--color-primary-dark-light)",
                }
            },
            keyframes: {
                'pulse-slow': {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '.5', transform: 'scale(1.05)' },
                },
                'gradient-shift': {
                    '0%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                    '100%': { backgroundPosition: '0% 50%' },
                }
            },
            animation: {
                'pulse-slow': 'pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient-shift': 'gradient-shift 15s ease infinite',
            }
        },
    },
    plugins: [],
}
