import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				'cormorant': ['Cormorant Garamond', 'serif'],
				'montserrat': ['Montserrat', 'sans-serif'],
				'inter': ['Inter', 'sans-serif'],
			},
			colors: {
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
				},
				
				// Perfumaria Luxo - Cores elegantes e tradicionais
				gold: {
					50: '#FFFBEB',
					100: '#FEF3C7',
					200: '#FDE68A',
					300: '#FCD34D',
					400: '#FBBF24',
					500: '#D4AF37',
					600: '#B8860B',
					700: '#92660A',
					800: '#744D08',
					900: '#5A3A06',
				},
				luxury: {
					50: '#F8FAFC',
					100: '#F1F5F9',
					200: '#E2E8F0',
					300: '#CBD5E1',
					400: '#94A3B8',
					500: '#64748B',
					600: '#475569',
					700: '#334155',
					800: '#1E293B',
					900: '#0F172A',
					950: '#020617',
				},
				
				// IA Cyberpunk - Cores neon vibrantes para elementos de IA
				cyber: {
					blue: '#00F5FF',      // Cyan elétrico
					purple: '#BF00FF',    // Magenta vibrante  
					pink: '#FF1493',      // Deep pink neon
					green: '#00FF41',     // Matrix green
					orange: '#FF6600',    // Laranja cyber
					yellow: '#FFFF00',    // Amarelo elétrico
				},
				
				// IA Status - Cores específicas para status de IA
				ai: {
					active: '#00F5FF',    // Sistema ativo
					processing: '#BF00FF', // Processando
					complete: '#00FF41',   // Completo
					error: '#FF1493',      // Erro
					warning: '#FF6600',    // Aviso
					idle: '#64748B',       // Inativo
				},
				
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				
				// IA Cyberpunk Animations
				'cyber-glow': {
					'0%': {
						boxShadow: '0 0 20px #00F5FF, 0 0 40px #00F5FF, 0 0 60px #00F5FF',
					},
					'25%': {
						boxShadow: '0 0 25px #BF00FF, 0 0 50px #BF00FF, 0 0 75px #BF00FF',
					},
					'50%': {
						boxShadow: '0 0 30px #FF1493, 0 0 60px #FF1493, 0 0 90px #FF1493',
					},
					'75%': {
						boxShadow: '0 0 25px #00FF41, 0 0 50px #00FF41, 0 0 75px #00FF41',
					},
					'100%': {
						boxShadow: '0 0 20px #00F5FF, 0 0 40px #00F5FF, 0 0 60px #00F5FF',
					}
				},
				'cyber-pulse': {
					'0%, 100%': {
						backgroundColor: '#00F5FF',
						boxShadow: '0 0 10px #00F5FF'
					},
					'33%': {
						backgroundColor: '#BF00FF',
						boxShadow: '0 0 15px #BF00FF'
					},
					'66%': {
						backgroundColor: '#FF1493',
						boxShadow: '0 0 15px #FF1493'
					}
				},
				'cyber-shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'gradient-x': {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' }
				},
				'particle-luxury': {
					'0%': {
						transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(0)',
						opacity: '0'
					},
					'10%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'90%': {
						opacity: '1'
					},
					'100%': {
						transform: 'translateY(-100vh) translateX(30px) rotate(180deg) scale(0)',
						opacity: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.6s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'gradient-x': 'gradient-x 4s ease infinite',
				'particle-luxury': 'particle-luxury 12s linear infinite',
				
				// IA Cyberpunk Animations
				'cyber-glow': 'cyber-glow 3s ease-in-out infinite',
				'cyber-pulse': 'cyber-pulse 2s ease-in-out infinite',
				'cyber-shimmer': 'cyber-shimmer 2s linear infinite',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'luxury-pattern': 'radial-gradient(circle at 2px 2px, rgba(212,175,55,0.1) 1px, transparent 0)',
				'cyber-gradient': 'linear-gradient(45deg, #00F5FF, #BF00FF, #FF1493, #00FF41)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
