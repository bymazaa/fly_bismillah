export const websiteDetails = {
    name: 'Fly Bismillah',
    url: 'https://www.flybismillah.com',
    description:
        'Fly Bismillah - Your Trusted Travel Partner for Hajj, Umrah, Flights, Hotels, and Tours.',
    address: 'Los Angeles,California 90057',
    phone: '+1-213-985-8499',
    email: 'murad.usa09@gmail.com',
    whatappsLink: 'https://api.whatsapp.com/send/?phone=12139858499',
    whatsappNumber: '12139858499',
};
// ==================== 1. Header & Navigation ====================
export const headerData = {
    contact: {
        email: 'murad.usa09@gmail.com',
        phones: ['+1 213-985-8499 (MI)', '+1 213-792-0038 (MI)', '+1 213-296-8786 (CA)'],
    },
    socialLinks: [
        {
            icon: 'whatsapp',
            href: 'https://api.whatsapp.com/send/?phone=12139858499&text=Hello%2C+Welcome+to+Bismillah+Travel+%26+Tours.%0D%0AWe%27re+excited+to+help+you+plan+your+next+trip&type=phone_number&app_absent=0',
        },
        { icon: 'facebook', href: 'https://www.facebook.com/FlyBismillah' },
        { icon: 'youtube', href: 'https://www.youtube.com/@FlyBismillah' },
        { icon: 'twitter', href: 'https://x.com/FlyBismillah' },
        { icon: 'instagram', href: 'https://www.instagram.com/flybismillah' },
        { icon: 'pinterest', href: 'https://www.pinterest.com/FlyBismillah/' },
    ],
    navLinks: [
        { label: 'HOME', href: '/', hasDropdown: false, subMenu: null },
        {
            label: 'FLIGHT',
            href: '#',
            hasDropdown: true,
            subMenu: [
                { label: 'Flight Search ', href: '/flights/search' },
                { label: 'Domestic Flight Booking', href: '/flights/domestic' },
                { label: 'International Flight Booking', href: '/flights/international' },
            ],
        },
        { label: 'Verify Ticket', href: '/order/status', hasDropdown: false, subMenu: null },
        {
            label: 'HAJJ',
            href: '/packages?type=hajj',
            hasDropdown: false,
            subMenu: null,
        },
        {
            label: 'HOTEL',
            href: '/hotel',
            hasDropdown: false,
            subMenu: null,
        },
        { label: 'ABOUT', href: '/about', hasDropdown: false },
        { label: 'VISA Process', href: '/visa-process', hasDropdown: false },
        { label: 'CONTACT', href: '/contact', hasDropdown: false, subMenu: null },
    ],
};

// ==================== 2. Hero Section ====================
export const heroData = {
    subtitle: 'Natural Beauty',
    title: 'Your Best Travel Partner',
    searchTabs: [
        { id: 1, label: 'Destinations', placeholder: 'Where are you going?', icon: 'map-pin' },
        { id: 2, label: 'Activity', placeholder: 'All Activity', icon: 'hiking' },
        { id: 3, label: 'Dates', placeholder: 'DD-MM-YYYY', icon: 'calendar' },
        { id: 4, label: 'Guests', placeholder: '2 Persons', icon: 'user' },
    ],
};

// ==================== 5. About Us Section ====================

export const aboutData = {
    subtitle: 'Take a Tour',
    title: 'We Are Dedicated to Make Your Hajj & Umrah Journey Spiritual',
    description:
        'At Bismillah Travel and Tour, we are passionate about making your travel dreams come true. Based in the USA & BD, we specialize in providing a wide range of travel services, including flight bookings, hotel reservations, Umrah and Hajj packages.',
    features: [
        'Best Airline Service Provider',
        'VIP/Non VIP Ticket Holder',
        'Worldwide Hotel Reservation',
        '24/7 Customer Support',
    ],
    stats: {
        years: '20+',
        label: 'Years of Experience',
    },
};

// about page
export const aboutPageData = {
    hero: {
        title: 'About Us',
        subtitle: 'Your trusted partner for Hajj, Umrah, and Worldwide Travel.',
        bgImage: '/asset/others/aboutbg.webp',
    },
    intro: {
        title: 'Welcome to our agency',
        heading: 'We make your travel dreams come true',
        description1:
            'At Bismillah Travel and Tour, we are passionate about making your travel dreams come true. Based in the USA, we specialize in providing a wide range of travel services, including flight bookings, hotel reservations, Umrah and Hajj packages, and personalized tours.',
        description2:
            'We understand that every traveler has unique needs. That’s why we offer tailored packages designed to suit your preferences and budget. Our team is committed to providing expert advice and exceptional service.',
        highlightBadge: '1M+ Travelers Monthly',
        image: '/asset/others/about-welcomwe.webp',
    },
    missionVision: [
        {
            title: 'Our Mission',
            text: 'To provide seamless and memorable travel experiences. We focus on offering personalized services for flights, hotels, and pilgrimage packages, ensuring each journey is smooth and enjoyable.',
            icon: 'mission',
        },
        {
            title: 'Our Vision',
            text: 'To be the leading travel agency in the USA, known for exceptional service, customer satisfaction, and offering accessible, customized travel solutions for both leisure and spiritual journeys.',
            icon: 'vision',
        },
    ],
    steps: {
        title: '3 Steps for the Perfect Trip',
        subtitle: 'Find Travel Perfection',
        desc: 'We have simplified the travel booking process for you.',
        items: [
            {
                id: 1,
                title: 'Tell us what you want to do',
                desc: "Share your travel goals, whether it's a pilgrimage or a vacation.",
            },
            {
                id: 2,
                title: 'Share your travel preference',
                desc: 'Let us know your budget, dates, and preferred accommodation style.',
            },
            {
                id: 3,
                title: 'We’ll give you recommendations',
                desc: 'Get a customized itinerary and package designed just for you.',
            },
        ],
    },
    stats: [
        { value: '28k', label: 'Total Users' },
        { value: '13k', label: 'Total Tours' },
        { value: '68k', label: 'Social Likes' },
        { value: '10k', label: '5 Star Ratings' },
    ],
    skills: [
        { label: 'Countryside Tours', percentage: 78 },
        { label: 'Vineyard & Nature', percentage: 92 },
        { label: 'Wine & Food Tasting', percentage: 62 },
    ],
};
// ==================== 6. Stats Section ====================

export const statsData = [
    { id: 1, value: '18k', label: 'Total Users', icon: 'users' },
    { id: 2, value: '5k', label: 'Total Tours', icon: 'map' },
    { id: 3, value: '68k', label: 'Social Likes', icon: 'like' },
    { id: 4, value: '10k', label: '5 Star Ratings', icon: 'star' },
];

// ==================== 7. Testimonials ====================

export const testimonialsData = [
    {
        id: 1,
        name: 'Ahmed Karim',
        role: 'Umrah Pilgrim',
        review: 'Alhamdulillah, the service was exceptional. From visa processing to hotel booking near Haram, everything was perfectly managed by Bismillah Travels.',
        rating: 5,
        image: '/asset/testimonial/32.webp',
    },
    {
        id: 2,
        name: 'Fatima Begum',
        role: 'London, UK',
        review: 'I booked a family holiday package to Dubai. The guide was very professional and the hotels were exactly as promised. Highly recommended!',
        rating: 5,
        image: '/asset/testimonial/44.webp',
    },
    {
        id: 3,
        name: 'Mohammad Riaz',
        role: 'Business Traveler',
        review: 'Great experience with flight booking. I got the best deal on urgent tickets. Their support team is available 24/7 which is very helpful.',
        rating: 4,
        image: '/asset/testimonial/85.webp',
    },
];

// ==================== 8. Blogs / News ====================

export const blogsData = [
    {
        id: 1,
        title: 'Essential Tips for First-Time Hajj Pilgrims',
        date: '10 Jan, 2026',
        author: 'Admin',
        excerpt:
            'Preparing for Hajj can be overwhelming. Here is a comprehensive guide on what to pack and how to prepare spiritually.',
        image: '/asset/blog/blog1.webp',
    },
    {
        id: 2,
        title: 'Top 5 Hidden Gems to Visit in Turkey',
        date: '05 Jan, 2026',
        author: 'Travel Desk',
        excerpt:
            'Turkey is more than just Istanbul. Discover the beautiful landscapes of Cappadocia and the ancient ruins of Ephesus.',
        image: '/asset/blog/glog2.webp',
    },
    {
        id: 3,
        title: 'How to Get the Best Deals on Flights',
        date: '28 Dec, 2025',
        author: 'Support',
        excerpt:
            'Want to save money on your next trip? Learn the secrets of booking cheap flights and the best times to fly.',
        image: '/asset/blog/blog3.webp',
    },
];

// ==================== Footer Data ====================
export const footerData = {
    about: {
        logo: '/images/logo-white.png',
        text: 'We are offers reliable travel services, including ticketing, visa processing, and tailored tour packages, ensuring seamless journeys and memorable experiences.',
    },
    contact: {
        title: 'CONTACT US',
        info: [
            { icon: 'map', text: 'Los Angeles,California 90057' },
            { icon: 'map', text: 'Warren, Michigan 48091' },
            { icon: 'phone', text: '+1 213-985-8499' },
            { icon: 'email', text: 'murad.usa09@gmail.com' },
        ],
    },
    support: {
        title: 'SUPPORT',
        links: [
            { label: 'FAQ', href: '/faq' },
             { label: 'Contact Us', href: '/contact' },
            { label: 'Privacy Policy', href: '/privacy-policy' },
            { label: 'Terms & conditions', href: '/terms-conditions' },
            { label: 'Refund Policy', href: '/refund-policy' },
           
        ],
    },
    getApp: {
        title: 'GET THE APP',
        text: 'Visit our website for the best experience and exclusive deals.',

        image: '/images/app-download-placeholder.png',
    },
    bottomBar: {
        copyright: 'Bismillah Travels. All rights reserved.',
    },
};

//partners data
export const partnersData = [
    {
        id: 1,
        name: 'MasterCard',
        logo: '/asset/sponsor/Mastercard-logo.svg',
    },
    {
        id: 13,
        name: 'American Express',
        logo: '/asset/sponsor/express.jpg',
    },
    {
        id: 2,
        name: 'Visa',
        logo: '/asset/sponsor/Visa_Inc._logo.svg',
    },
    {
        id: 3,
        name: 'Discover',
        logo: '/asset/sponsor/Discover_Card_logo.svg',
    },
    {
        id: 4,
        name: 'IATA',
        logo: '/asset/sponsor/1200px-IATA_logo.webp',
    },
];

//cotact page data
export const contactPageData = {
    header: {
        title: 'Get In Touch',
        subtitle:
            'Have questions about Hajj, Umrah, or Holiday packages? We are here to help you 24/7.',
    },
    info: {
        locations: [
            {
                id: 1,
                city: 'Los Angeles Office',
                address: 'Los Angeles,California 90057',
                icon: 'map',
            },
            {
                id: 2,
                city: 'Michigan Office',
                address: 'Warren, Michigan 48091',
                icon: 'map',
            },
        ],
        contacts: [
            {
                id: 'phone',
                label: 'Phone Number',
                value: '+1 213-985-8499',
                link: 'tel:+12139858499',
                icon: 'phone',
            },
            {
                id: 'email',
                label: 'Email Us',
                value: 'murad.usa09@gmail.com',
                link: 'mailto:murad.usa09@gmail.com',
                icon: 'email',
            },
            {
                id: 'whatsapp',
                label: 'Message on WhatsApp',
                value: '+1 213-985-8499',
                link: 'https://api.whatsapp.com/send/?phone=12139858499',
                icon: 'whatsapp',
            },
        ],
    },
};

// ==================== 9. Packages Data ====================
export interface PackageType {
    id: number;
    title: string;
    price: string;
    image: string;
    category: 'Hajj' | 'Umrah' | 'Tour';
    description: string;
    slug: string;
    location: string;
}

// packages data
export const packages = [
    // --- HAJJ PACKAGES (Based on your Image) ---
    {
        id: 1,
        slug: 'economy-hajj-package-1e-2025',
        title: 'Bismillah Tours Economy Hajj Package 1E 2025: 13 Nights Package',
        price: '$7,148.00',
        image: "/978ffb16be030a299ad164e390480d92.jpg", // Kaaba
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description: `Departure from USA: 28th May | Departure from Saudi Arabia: 10th June.
        
        **Madinah Stay:** Saja Al Madinah Hotel Or Similar (29th May - 03 Nights). Half Board included.
        **Makkah Stay:** Azizia Building (01st June - 09 Nights). Close to Jamarat. Half Board included.
        **Manasik Hajj:** Category "D" Camps in Mina & Arafat (04th June - 08th June).
        
        **Package Includes:**
        - Hajj Visa Included (Pakistani Citizens Only)
        - Medical Insurance & Wristbands
        - Full Board in Mina/Arafat (Breakfast, Lunch, Dinner box)
        - Visit to Historical Sites In Madinah (Ziyarat)
        - Guided by Experienced Group Leaders & Scholars
        - Gift Pack: Ihram, Prayer Rugs, Shoe Bag
        - 24 Hours Assistance during the stay
        - Full VIP Bus Transport for all transfers
        
        **Land Package Pricing:**
        - Quad: $7,148.00/Person
        - Triple: $7,648.00/Person
        - Double: $8,148.00/Person`,
        included: [
            'Round Trip Airfare',
            'Hajj Visa & Insurance',
            'Economy Hotel / Azizia',
            'Full Board Meals',
            'Guided Hajj Rituals',
            'VIP Bus Transport',
        ],
    },
    {
        id: 2,
        slug: 'economy-hajj-package-1d-2025',
        title: 'Bismillah Tours Economy Hajj Package 1D 2025: 13 Nights Package',
        price: '$8,448.00',
        image: '/asset/hajj/hajj2.webp', // madina
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description: `Departure from USA: 30th May | Departure from Saudi Arabia: 12th June.
        
        **Madinah Stay:** Pullman Zamzam Madinah (5 Star) - 03 Nights. Open Buffet Breakfast & Dinner.
        **Makkah Stay:** Premium Azizia Apartment (Walking distance to Jamarat) - 10 Nights.
        **Manasik Hajj:** Upgraded European Tents in Mina (04th June - 08th June).
        
        **Package Highlights:**
        - Direct Flights from JFK/IAD
        - Hajj Visa Processing & MoH Fees
        - Qurbani Included
        - Private Air-Conditioned Buses for Mina-Arafat-Muzdalifah
        - Educational Seminars by Shaykh
        - Ziyarat in Makkah & Madinah with Guide
        - Complimentary 5L Zamzam Water
        
        **Land Package Pricing:**
        - Quad: $8,448.00/Person
        - Triple: $8,948.00/Person
        - Double: $9,548.00/Person`,
        included: [
            'Direct Flights',
            'Hajj Visa',
            '5 Star Madinah Hotel',
            'Azizia Apartment',
            'Qurbani',
            'VIP Tents',
            'Buffet Meals',
        ],
    },
    {
        id: 3,
        slug: 'deluxe-hajj-package-1c-2025',
        title: 'Bismillah Tours Deluxe Hajj Package 1C 2025: (No Azizia)-13 Nights Package',
        price: '$9,448.00',
        image: '/asset/hajj/hajj3.webp', // Kaaba
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description: `Departure from USA: 2nd June | Return: 15th June. **NO AZIZIA SHIFTING - Direct Hotel Stay.**
        
        **Makkah Stay:** Swissotel Makkah (Clock Tower) - 05 Nights (Before Hajj). Steps away from Haram.
        **Madinah Stay:** Anwar Al Madinah Mövenpick - 04 Nights (After Hajj).
        **Manasik Hajj:** VIP North American Tents (Zone B) - Sofa beds, AC, Buffet meals.
        
        **Exclusive Services:**
        - No Shifting to Azizia (Maximum Comfort)
        - Hajj Visa & Drafts
        - Buffet Breakfast & Dinner in Hotels
        - 24/7 Tea/Coffee & Snacks in Mina Tent
        - Dedicated Mutawwif for Group
        - Private VIP Bus (Model 2024/25)
        
        **Land Package Pricing:**
        - Quad: $9,448.00/Person
        - Triple: $10,148.00/Person
        - Double: $11,248.00/Person`,
        included: [
            'No Shifting (Direct Hotel)',
            'Clock Tower Hotel',
            'North American Tents',
            'Hajj Visa',
            'Full Board',
            'Private Transport',
        ],
    },
    {
        id: 4,
        slug: 'super-deluxe-hajj-package-1b-2025',
        title: 'Bismillah Tours Super Deluxe Hajj Package 1B 2025: (No Azizia)-13 Nights Package',
        price: '$12,198.00',
        image: '/asset/hajj/hajj4.webp', // Kaaba
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description: `Departure: 4th June | Return: 17th June. **The Ultimate Luxury Hajj Experience.**
        
        **Makkah Stay:** Fairmont Makkah Clock Royal Tower (5 Star) - 05 Nights. Kaaba View Rooms available on request.
        **Madinah Stay:** The Oberoi Madinah (Steps from Green Dome) - 04 Nights.
        **Manasik Hajj:** VIP Majed Tents (Zone A - Closest to Jamarat). Private washrooms available.
        
        **VIP Features:**
        - Fast Track Immigration
        - Private SUV Transfers (GMC/Land Cruiser) option available
        - Open Buffet 24/7 in Mina
        - Exclusive religious guidance by Senior Scholars
        - Ziyarat of Historical sites in Luxury Bus
        - Meet & Greet Service at Jeddah Airport
        
        **Land Package Pricing:**
        - Quad: $12,198.00/Person
        - Triple: $13,198.00/Person
        - Double: $14,698.00/Person`,
        included: [
            'Fairmont & Oberoi Hotels',
            'Zone A VIP Tents',
            'Fast Track Immigration',
            'Gourmet Dining',
            'Private Washrooms (Mina)',
            'No Shifting',
        ],
    },
    {
        id: 5,
        slug: 'executive-hajj-package-1a-2025',
        title: 'Bismillah Tours Executive Hajj Package 1A 2025: (No Azizia)-13 Nights Package',
        price: '$12,948.00',
        image: '/makka.jpg', // Kaaba
        category: 'Hajj',
        location: 'Makkah & Madinah',
        description: `Departure: 4th June | Return: 17th June. **Executive Service for Distinguished Guests.**
        
        **Makkah Stay:** Raffles Makkah Palace (Suites Only) - 05 Nights. 24-hour Butler Service.
        **Madinah Stay:** Dar Al Iman InterContinental - 04 Nights. Haram View.
        **Manasik Hajj:** Royal Tents in Mina (Zone A+). Private Cubicles, Ensuite Bathrooms, Executive Lounge access.
        
        **Executive Inclusions:**
        - Business Class Flights Included
        - Private Limousine Transfer for Airport & Inter-city
        - Hajj Visa (VIP Processing)
        - 1-on-1 Scholar Session
        - Premium Gift Hamper (Perfumes, Premium Dates, Ihram)
        - Dedicated Porter Service throughout the trip
        
        **Land Package Pricing:**
        - Quad: $12,948.00/Person
        - Triple: $13,948.00/Person
        - Double: $16,948.00/Person`,
        included: [
            'Raffles & InterContinental',
            'Royal Tents (Ensuite)',
            'Business Class Flight',
            'Private Limousine',
            'Butler Service',
            'VIP Hajj Visa',
        ],
    },

    // --- UMRAH PACKAGES (Updated Description Style) ---
    {
        id: 6,
        slug: 'package-1c-2025-umrah',
        title: 'Package 1C 2025: (15th Apr/31st Dec) & (01st Jan/11th Mar)-10 Nights Package',
        price: '$2,048.00',
        image: '/madina_makka.jpg', // Kaaba
        category: 'Umrah',
        location: 'Makkah & Madinah',
        description: `Flexible Departure Dates. **Ideal for Families.**
        
        **Makkah Stay:** Swissotel Al Maqam (5 Nights). Direct access to Haram via Tunnel.
        **Madinah Stay:** Anwar Al Madinah (5 Nights). Steps from Ladies Gate.
        
        **Package Details:**
        - Umrah Visa Processing (USA/UK/Canada/Bangladesh passports)
        - Daily Open Buffet Breakfast
        - Complete Ground Transportation by GMC/H1
        - Ziyarat in Makkah: Cave Hira, Thawr, Mina, Arafat
        - Ziyarat in Madinah: Quba Mosque, Qiblatain, Uhud
        - Valid from April 2025 to March 2026
        
        **Pricing:**
        - Quad: $2,048/Person
        - Triple: $2,248/Person
        - Double: $2,548/Person`,
        included: [
            'Umrah Visa',
            '5 Star Hotels',
            'Daily Breakfast',
            'Private Transport',
            'Ziyarat Tours',
            'Rawdah Permit',
        ],
    },
    {
        id: 7,
        slug: 'package-1b-2025-umrah',
        title: 'Package 1B 2025: (15th Apr/31st Dec) & (01st Jan/11th Mar)-07 Nights Package',
        price: '$1,648.00',
        image: '/asset/hajj/hajj2.webp', // Kaaba
        category: 'Umrah',
        location: 'Makkah & Madinah',
        description: `Short & Spiritual. **Perfect for a 1-Week Trip.**
        
        **Makkah Stay:** Le Meridien Makkah (4 Nights). Shuttle service available 24/7.
        **Madinah Stay:** Crowne Plaza Madinah (3 Nights).
        
        **Package Features:**
        - Electronic Umrah Visa included
        - Meet & Assist at Jeddah/Madinah Airport
        - Breakfast included
        - High-Speed Haramain Train Ticket (Makkah to Madinah)
        - Guidance on Umrah Rituals
        
        **Pricing:**
        - Quad: $1,648/Person
        - Triple: $1,748/Person
        - Double: $1,948/Person`,
        included: [
            'Umrah Visa',
            '4/5 Star Hotels',
            'Haramain Train',
            'Breakfast',
            'Airport Transfer',
        ],
    },
    {
        id: 8,
        slug: 'package-1a-2025-umrah',
        title: 'Package 1A 2025: (15th Apr/31st Dec) & (01st Jan/11th Mar)-05 Nights Package',
        price: '$1,348.00',
        image: '/asset/hajj/hajj3.webp', // Kaaba
        category: 'Umrah',
        location: 'Makkah Only',
        description: `Express Umrah. **Focus on Makkah.**
        
        **Makkah Stay:** Hilton Suites Makkah (5 Nights). Located in Jabal Omar, overlooking the Haram.
        
        **Package Inclusions:**
        - Umrah Visa with Insurance
        - Private Car for Jeddah Airport to Hotel Transfer
        - Ziyarat of Holy Sites in Makkah
        - Daily Breakfast
        - 24/7 WhatsApp Support
        
        **Pricing:**
        - Quad: $1,348/Person
        - Triple: $1,448/Person
        - Double: $1,648/Person`,
        included: [
            'Makkah Stay Only',
            'Hilton Suites',
            'Umrah Visa',
            'Private Transfer',
            'Breakfast',
        ],
    },

    // --- OTHER PACKAGES (Updated Descriptions to be detailed) ---
    {
        id: 9,
        slug: 'alaqsa-jerusalem-tour',
        title: 'Al-Aqsa & Jerusalem Tour - 5 Days',
        price: '$1,800.00',
        image: '/asset/hajj/Al-Aqsa.jpg', // Kaaba
        category: 'Heritage',
        location: 'Jerusalem, Palestine',
        description: `**Day 1: Arrival in Amman & Transfer to Jerusalem.** Crossing the Allenby Bridge border. Check-in at the National Hotel Jerusalem (4 Star).
        
        **Day 2: Jumu'ah at Al-Aqsa.** Guided tour of the Old City. Visit Dome of the Rock, Al-Aqsa Mosque, and the Buraq Wall.
        
        **Day 3: Hebron & Bethlehem.** Visit the Masjid Ibrahimi (Tomb of Prophet Ibrahim A.S) and birthplace of Prophet Isa A.S.
        
        **Day 4: Islamic History.** Visit Mount of Olives, Tomb of Salman Al Farsi, and Rabia Basri.
        
        **Day 5: Departure.** Transfer back to Amman Airport for flight.
        
        **Includes:**
        - All Border Taxes
        - English Speaking Muslim Guide
        - Daily Breakfast & Dinner
        - VIP Bus Transport`,
        included: [
            'Return Flights',
            'Entry Visa & Taxes',
            'Heritage Hotel',
            'Muslim Guide',
            'Ziyarat of Prophets',
            'Half Board Meals',
        ],
    },
    {
        id: 10,
        slug: 'turkey-islamic-history',
        title: 'Turkey Islamic History - 8 Days',
        price: '$1,650.00',
        image: '/asset/hajj/turkey.jpg',
        category: 'Heritage',
        location: 'Istanbul & Bursa',
        description: `**Day 1-4: Istanbul - The City of Sultans.**
        Stay at The Peak Hotel (4 Star). Visit Sultan Ahmet (Blue Mosque), Hagia Sophia Grand Mosque, and Topkapi Palace Museum (Holy Relics). Full day Bosphorus Cruise with dinner.
        
        **Day 5-7: Bursa - The First Ottoman Capital.**
        Visit the Grand Mosque (Ulu Cami), Green Tomb, and Cable Car ride to Uludag Mountain. Shopping at the Silk Market.
        
        **Day 8: Departure.**
        Private transfer to IST Airport.
        
        **Package Includes:**
        - Domestic Flight (Istanbul-Bursa)
        - Museum Entry Tickets
        - Daily Breakfast
        - English Speaking Guide`,
        included: [
            'Intl & Domestic Flight',
            'E-Visa',
            '4 Star Hotels',
            'Bosphorus Cruise',
            'Museum Tickets',
            'Daily Breakfast',
        ],
    },
    {
        id: 11,
        slug: 'dubai-family-fun',
        title: 'Dubai Family Fun - 5 Days',
        price: '$950.00',
        image: '/asset/tour/The-Dubai-Fountain.webp',
        category: 'Holiday',
        location: 'Dubai, UAE',
        description: `**Day 1: Arrival & Dhow Cruise.**
        Meet & Greet at DXB Airport. Evening Marina Dhow Cruise with International Buffet Dinner. Stay at Citymax Hotel Bur Dubai.
        
        **Day 2: City Tour & Burj Khalifa.**
        Half-day Dubai City Tour (Palm Jumeirah, Atlantis photo stop). Evening visit to Burj Khalifa 124th Floor (Non-prime hours).
        
        **Day 3: Desert Safari.**
        Afternoon pickup by 4x4 Land Cruiser. Dune Bashing, Camel Ride, Belly Dance Show, and BBQ Dinner in the desert camp.
        
        **Day 4: Shopping & Leisure.**
        Free day for shopping at Dubai Mall or Gold Souk.
        
        **Day 5: Departure.**
        Drop off at airport.`,
        included: [
            'Round Trip Flight',
            'UAE Tourist Visa',
            'Citymax Hotel',
            'Desert Safari (BBQ)',
            'Burj Khalifa Ticket',
            'All Transfers',
        ],
    },
    {
        id: 12,
        slug: 'maldives-honeymoon',
        title: 'Maldives Honeymoon Bliss - 4 Days',
        price: '$2,100.00',
        image: '/asset/tour/Male-maldives.webp',
        category: 'Holiday',
        location: 'Male, Maldives',
        description: `**The Ultimate Romantic Getaway.**
        Stay at **Adaaran Prestige Vadoo** (5 Star) in a Sunrise Water Villa with Private Jacuzzi.
        
        **Inclusions:**
        - **All-Inclusive Plan:** Unlimited Food & Premium Beverages (Alcohol/Non-Alcohol).
        - **Transfers:** Round trip Speedboat transfer from Male Airport.
        - **Honeymoon Specials:** Bed decoration, Candlelight Dinner on the beach, and a Complimentary Cake.
        - **Activities:** Snorkeling gear, Evening entertainment, and Sunset Fishing trip.
        
        **Pricing:** Based on double occupancy.`,
        included: [
            'Return Flights',
            'Visa Free Entry',
            'Water Villa + Jacuzzi',
            'Speedboat Transfer',
            'All-Inclusive Meals',
            'Honeymoon Cake',
        ],
    },
];

// ==================== 4. Popular Destinations ====================
export const destinations = [
    {
        id: 1,
        slug: 'male-maldives',
        name: 'Malé, Maldives',
        country: 'Maldives',
        reviews: 156,
        rating: 4.8,
        image: '/asset/tour/Male-maldives.webp',
        description:
            'Discover the sunny side of life. Malé is the gateway to the Maldives, offering overwater villas, crystal clear turquoise waters, and vibrant coral reefs perfect for diving and snorkeling.',
        bestTime: 'November to April',
        currency: 'Maldivian Rufiyaa (MVR)',
        language: 'Dhivehi',
        attractions: [
            'Grand Friday Mosque',
            'Banana Reef',
            'Artificial Beach',
            'Local Market',
            'Maafushi Island',
        ],
        gallery: ['/asset/tour/mald-sub1.jpg', '/asset/tour/mald-sub2.webp'],
    },
    {
        id: 2,
        slug: 'burj-khalifa-dubai',
        name: 'Burj Khalifa, Dubai',
        country: 'United Arab Emirates',
        reviews: 850,
        rating: 4.9,
        image: '/asset/tour/burj.avif',
        description:
            "The world's tallest building. Experience breathtaking views from the observation decks on the 124th, 125th, and 148th floors. A marvel of modern engineering and design.",
        bestTime: 'November to March',
        currency: 'Dirham (AED)',
        language: 'Arabic',
        attractions: [
            'At The Top Sky',
            'Dubai Mall',
            'Dubai Aquarium',
            'Dubai Opera',
            'Souk Al Bahar',
        ],
        gallery: ['/asset/tour/burj.avif'],
    },
    {
        id: 3,
        slug: 'makkah-saudi-arabia',
        name: 'Makkah (The Holy Kaaba)',
        country: 'Saudi Arabia',
        reviews: 1200,
        rating: 5.0,
        image: '/asset/tour/Al-Kaaba-saudi-arabia.webp',
        description:
            'The holiest city in Islam. Millions of pilgrims travel here for Hajj and Umrah to visit the Masjid al-Haram and the Holy Kaaba. A place of peace and spiritual reflection.',
        bestTime: 'November to February (Umrah)',
        currency: 'Saudi Riyal (SAR)',
        language: 'Arabic',
        attractions: ['Masjid Al-Haram', 'Jabal al-Nour', 'Abraj Al-Bait', 'Mina', 'Mount Arafat'],
        gallery: ['/asset/hajj/hajj1.webp', '/asset/hajj/hajj3.webp'],
    },
    {
        id: 4,
        slug: 'sagarmatha-national-park',
        name: 'Sagarmatha National Park',
        country: 'Nepal',
        reviews: 180,
        rating: 4.8,
        image: '/asset/tour/Sagarmatha-National-Park-Nepal.webp',
        description:
            'Home to Mount Everest, the highest peak in the world. This protected area in the Himalayas offers dramatic mountains, glaciers, and deep valleys. A paradise for trekkers.',
        bestTime: 'Oct-Nov & Mar-May',
        currency: 'Nepalese Rupee (NPR)',
        language: 'Nepali',
        attractions: [
            'Mount Everest',
            'Namche Bazaar',
            'Tengboche Monastery',
            'Kala Patthar',
            'Gokyo Lakes',
        ],
        gallery: ['/asset/tour/sug-sub1.webp', '/asset/tour/sug-sub2b.webp'],
    },
    {
        id: 5,
        slug: 'senso-ji-temple-tokyo',
        name: 'Senso-ji Temple, Tokyo',
        country: 'Japan',
        reviews: 420,
        rating: 4.7,
        image: '/asset/tour/Senso-ji-Japan.webp',
        description:
            "Tokyo's oldest and most significant ancient Buddhist temple. Located in Asakusa, it is dedicated to Kannon, the bodhisattva of compassion. The vibrant Nakamise shopping street leads to it.",
        bestTime: 'March to May (Cherry Blossom)',
        currency: 'Japanese Yen (JPY)',
        language: 'Japanese',
        attractions: [
            'Kaminarimon Gate',
            'Nakamise Shopping Street',
            'Asakusa Shrine',
            'Five-story Pagoda',
            'Tokyo Skytree',
        ],
        gallery: ['/asset/tour/Senso-ji-sub1.webp'],
    },
    {
        id: 6,
        slug: 'dubai-fountain',
        name: 'The Dubai Fountain',
        country: 'United Arab Emirates',
        reviews: 600,
        rating: 4.8,
        image: '/asset/tour/The-Dubai-Fountain.webp',
        description:
            "The world's largest choreographed fountain system. Set on the huge Burj Khalifa Lake, the fountain shoots water up to 500 ft in the air accompanied by music and light shows.",
        bestTime: 'Year-round (Evening)',
        currency: 'Dirham (AED)',
        language: 'Arabic',
        attractions: [
            'Fountain Show',
            'Burj Park',
            'Dubai Opera',
            'Souk Al Bahar',
            'Dubai Mall Boardwalk',
        ],
        gallery: ['/asset/tour/duabisub1.webp'],
    },
    {
        id: 8,
        slug: 'himeji-castle-japan',
        name: 'Himeji Castle',
        country: 'Japan',
        reviews: 310,
        rating: 4.8,
        image: '/asset/tour/Himeji-Castle-Japan1.webp',
        description:
            'Also known as the "White Heron Castle" due to its elegant, white appearance. Himeji Castle is the finest surviving example of early 17th-century Japanese castle architecture and a UNESCO World Heritage Site.',
        bestTime: 'March to May (Cherry Blossoms) & Sept to Nov',
        currency: 'Japanese Yen (JPY)',
        language: 'Japanese',
        attractions: [
            'Main Keep (Tenshu)',
            'Koko-en Garden',
            'Hyakken Roka',
            'Senhime Peony Garden',
            'Nishi-No-Maru',
        ],
        gallery: ['/asset/tour/himeji1.webp', '/asset/tour/himeji2sub.webp'],
    },
    {
        id: 9,
        slug: 'great-wall-china',
        name: 'Great Wall of China',
        country: 'China',
        reviews: 2500,
        rating: 4.9,
        image: '/asset/tour/greatwall.avif',
        description:
            'One of the greatest wonders of the world. A series of fortifications that stretch thousands of miles, built to protect the Chinese empires. Walking on the wall offers breathtaking views of the surrounding mountains.',
        bestTime: 'April to May & Sept to Oct',
        currency: 'Chinese Yuan (CNY)',
        language: 'Mandarin',
        attractions: [
            'Mutianyu Section',
            'Badaling Section',
            'Jinshanling',
            'Simatai',
            'Juyongguan',
        ],
        gallery: ['/asset/tour/Great-Wall-of-China.webp'],
    },
];