export interface VisaType {
    id: number;
    country: string;
    visaType: string;
    validity: string;
    maxStay: string;
    processingTime: string;
    price: number; // Only USD
    image: string;
    requirements: string[];
}

export const visaPackages: VisaType[] = [
    {
        id: 1,
        country: 'Dubai (UAE)',
        visaType: 'E-Visa',
        validity: '60 Days',
        maxStay: '30 Days',
        processingTime: '2-3 Working Days',
        price: 75, // USD
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
        requirements: [
            'Passport Scan Copy (Min 6 months validity)',
            'Recent White Background Photo',
            'NID Copy or Birth Certificate',
            'Previous Visa Copy (if any)'
        ]
    },
    {
        id: 2,
        country: 'Thailand',
        visaType: 'Sticker Visa',
        validity: '90 Days',
        maxStay: '60 Days',
        processingTime: '5-7 Working Days',
        price: 50, // USD
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=800&auto=format&fit=crop',
        requirements: [
            'Original Passport',
            'Bank Statement (Last 6 Months)',
            'Solvency Certificate',
            '2 Recent Photos (3.5x4.5cm, White BG)',
            'Visiting Card & Pad (Business)',
            'NOC (Job Holder)'
        ]
    },
    {
        id: 3,
        country: 'Malaysia',
        visaType: 'E-Visa',
        validity: '90 Days',
        maxStay: '30 Days',
        processingTime: '3-5 Working Days',
        price: 40, // USD
        image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=800&auto=format&fit=crop',
        requirements: [
            'Passport Scan Copy',
            'White Background Photo',
            'Flight Booking Copy',
            'Hotel Booking Copy'
        ]
    },
    {
        id: 4,
        country: 'Singapore',
        visaType: 'E-Visa',
        validity: '35 Days',
        maxStay: '30 Days',
        processingTime: '4-6 Working Days',
        price: 55, // USD
        image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=800&auto=format&fit=crop',
        requirements: [
            'Passport Bio Page Scan',
            'Photo (Matte Paper, White BG)',
            'Visiting Card',
            'NOC / Trade License',
            'Bank Statement (Personal)'
        ]
    },
    {
        id: 5,
        country: 'Saudi Arabia',
        visaType: 'Umrah Visa',
        validity: '90 Days',
        maxStay: '90 Days',
        processingTime: '1-2 Working Days',
        price: 160, // USD
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=800&auto=format&fit=crop',
        requirements: [
            'Passport Scan Copy',
            'Recent Photo',
            'NID Copy',
            'Biometric Registration Slip'
        ]
    },
    {
        id: 6,
        country: 'Vietnam',
        visaType: 'E-Visa',
        validity: '30 Days',
        maxStay: '30 Days',
        processingTime: '3-4 Working Days',
        price: 60, // USD
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
        requirements: [
            'Passport Scan Copy',
            'Recent Photo',
            'Confirm Travel Date'
        ]
    }
];