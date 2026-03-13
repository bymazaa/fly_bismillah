// constant/theme.ts

export const appTheme = {
  // ================= 1. Color Palette =================
  colors: {
    // Brand Colors
    brand: {
      primary: "bg-rose-600",
      secondary: "bg-teal-600",
      accent: "text-rose-600",
    },
    
    // Backgrounds
    background: {
      main: "bg-white",
      light: "bg-gray-50",
      dark: "bg-gray-900",
      overlay: "bg-black/50",
    },

    // Specific Component Colors (For better control)
    topBar: {
      bg: "bg-gray-950",          
      text: "text-gray-100",       
      iconBg: "bg-gray-800",       
      iconHover: "hover:text-rose-500", 
    },
    
    navbar: {
      bg: "bg-white/90 backdrop-blur-md", 
      text: "text-gray-800",  
      hoverText:"hover:text-rose-500",       
      border: "border-gray-200",         
    },

    // General Text
    text: {
      heading: "text-gray-900",
      body: "text-gray-600",
      muted: "text-gray-400",
      light: "text-white",
    },
  },

  // ================= 2. Button Styles =================
  button: {
    // Solid Dark Button (Sign Up, Search)
    primary: "bg-rose-600 text-white hover:bg-red-700 shadow-2xl shadow-gray-100 hover:shadow-xl active:scale-95 transition-all duration-300",
    
    // Outline / White Button
    secondary: "bg-gray-50 text-gray-800 border border-gray-200/60 hover:text-white hover:bg-rose-500 hover:border-gray-300 shadow-2xl  shadow-gray-100 transition-all duration-300",
    
    // Transparent Button (Login, Nav links)
    ghost: "text-gray-700 hover:text-gray-900 hover:bg-gray-100/50",
    
    // Round Icon Button
    icon: "bg-white text-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform border border-gray-100",
  },

  // ================= 3. Layout & Spacing =================
  layout: {
    container: "container mx-auto px-4 md:px-6 lg:px-8",
    sectionPadding: "py-16 md:py-24",
    radius: {
      default: "rounded-xl",
      full: "rounded-full",
      card: "rounded-2xl",
    }
  },

  // ================= 4. Typography =================
  typography: {
    h1: "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight",
    h2: "text-3xl md:text-4xl font-bold text-gray-900",
    h3: "text-xl md:text-2xl font-semibold",
    body: "text-base text-gray-600 leading-relaxed",
    subtitle: "font-cursive text-2xl md:text-3xl text-rose-500 italic", // "Natural Beauty" এর জন্য
  }
};