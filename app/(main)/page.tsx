
import Hero from './components/Hero';
import { appTheme } from '@/constant/theme/global';
import About from './components/About';
import Testimonials from './components/Testimonial';
import Blog from './components/Blog';
import PopularDestinations from './components/PopularDestinations';
import Partners from './components/Partners';
import Stats from './components/Stats';
import PackageSection from './components/PackageSection';
import PromoSection from './components/PromoSection';


export default function Home() {
    const { colors } = appTheme;
    return (
        <main className={`min-h-screen font-sans ${colors.background.main}`}>
            {/* 1. Navbar */}

            {/* 2. Hero Section */}
            <Hero />
        
            {/* 3. Discover Weekly Section */}
           <PackageSection/>
            <PopularDestinations />
                <PromoSection/>
            <About />
            <Stats />
            <Testimonials />
            <Blog />
            <Partners />
        </main>
    );
}
