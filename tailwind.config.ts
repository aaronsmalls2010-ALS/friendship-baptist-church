import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			purple: {
  				'50': '#F5F0FA',
  				'100': '#EBE0F5',
  				'200': '#D4BFE9',
  				'300': '#B894D9',
  				'400': '#9B67C7',
  				'500': '#7B3FAF',
  				'600': '#5E2494',
  				'700': '#4A1A8A',
  				'800': '#3D1273',
  				'900': '#2E0D5A',
  				'950': '#1A0636'
  			},
  			peach: {
  				'50': '#FFF5EE',
  				'100': '#FFE8D6',
  				'200': '#FFD0AD',
  				'300': '#F5B88A',
  				'400': '#E8A87C',
  				'500': '#D4915F',
  				'600': '#BF7A48',
  				'700': '#A16438',
  				'800': '#82502E',
  				'900': '#6B4227'
  			},
  			gold: {
  				'50': '#FFFDF0',
  				'100': '#FFF8D4',
  				'200': '#FFF0A8',
  				'300': '#FFE574',
  				'400': '#FFD740',
  				'500': '#E6BE00',
  				'600': '#C7A400',
  				'700': '#A38600',
  				'800': '#856C00',
  				'900': '#6B5700'
  			},
  			warm: {
  				'50': '#FAF9FB',
  				'100': '#F5F3F7',
  				'200': '#EBE8EF',
  				'300': '#D9D5E0',
  				'400': '#B5AEBF',
  				'500': '#918A9E',
  				'600': '#6E677E',
  				'700': '#534D62',
  				'800': '#3A3548',
  				'900': '#242030',
  				'950': '#13111A'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			}
  		},
  		fontFamily: {
  			heading: [
  				'var(--font-playfair)',
  				'Georgia',
  				'serif'
  			],
  			body: [
  				'var(--font-inter)',
  				'system-ui',
  				'sans-serif'
  			],
  			scripture: [
  				'var(--font-cormorant)',
  				'Georgia',
  				'serif'
  			]
  		},
  		fontSize: {
  			'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  			'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.33vw, 1rem)',
  			'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
  			'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
  			'fluid-xl': 'clamp(1.25rem, 1rem + 1.25vw, 1.5rem)',
  			'fluid-2xl': 'clamp(1.5rem, 1.1rem + 2vw, 2rem)',
  			'fluid-3xl': 'clamp(1.875rem, 1.2rem + 3.3vw, 2.5rem)',
  			'fluid-4xl': 'clamp(2.25rem, 1.3rem + 4.75vw, 3.5rem)',
  			'fluid-hero': 'clamp(2.75rem, 1.5rem + 6.25vw, 5rem)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			glow: '0 0 20px rgba(74, 26, 138, 0.15)',
  			'glow-lg': '0 0 40px rgba(74, 26, 138, 0.2)',
  			'card-hover': '0 8px 30px rgba(74, 26, 138, 0.12)'
  		},
  		backgroundImage: {
  			'gradient-purple': 'linear-gradient(135deg, #4A1A8A 0%, #7B3FAF 50%, #9B67C7 100%)',
  			'gradient-warm': 'linear-gradient(135deg, #4A1A8A 0%, #E8A87C 100%)',
  			'gradient-gold': 'linear-gradient(135deg, #FFD740 0%, #E6BE00 100%)',
  			'gradient-hero': 'linear-gradient(180deg, rgba(26, 6, 54, 0.8) 0%, rgba(74, 26, 138, 0.4) 50%, transparent 100%)'
  		},
  		keyframes: {
  			'fade-in-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			shimmer: {
  				'0%': {
  					backgroundPosition: '-200% 0'
  				},
  				'100%': {
  					backgroundPosition: '200% 0'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0)'
  				},
  				'50%': {
  					transform: 'translateY(-10px)'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'fade-in-up': 'fade-in-up 0.6s ease-out',
  			'fade-in': 'fade-in 0.4s ease-out',
  			shimmer: 'shimmer 2s linear infinite',
  			float: 'float 6s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
