/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        primary: 'var(--color-primary)',      
        secondary: 'var(--color-secondary)',    
        'secondary-bg': 'var(--color-secondary-bg)', 
        
        charcoal: 'var(--color-charcoal)',     
        slate: 'var(--color-slate)',        
        
        success: 'var(--color-success)',      
        'success-bg': 'var(--color-success-bg)', 
        
        error: 'var(--color-error)',        
        'error-bg': 'var(--color-error-bg)',   
        
        warning: 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-bg)', 
        
        info: 'var(--color-info)',
        'info-bg': 'var(--color-info-bg)',    
        
        bgpage: 'var(--color-bgpage)',
      }
    },
  },
  plugins: [],
}
