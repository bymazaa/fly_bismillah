// ================== DUMMY DATA GENERATOR ==================

// Types based on your models (Simplified for dashboard view)
export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';
export type PackageCategory = 'Hajj' | 'Umrah' | 'Holiday';

export interface DummyBooking {
  id: string;
  customerName: string;
  packageTitle: string;
  price: number;
  travelDate: string;
  status: BookingStatus;
  createdAt: string; // ISO date string for sorting/charting
}

export interface ChartDataPoint {
  name: string; // e.g., Month name or Category name
  value: number;
  revenue?: number;
  color?: string;
  bookings?: number;
}

// Helpers to generate random data
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomStatus = (): BookingStatus => ['Pending', 'Confirmed', 'Confirmed', 'Cancelled'][getRandomInt(0, 3)] as BookingStatus;
const getRandomCategory = (): PackageCategory => ['Hajj', 'Umrah', 'Holiday'][getRandomInt(0, 2)] as PackageCategory;

const names = ["Ahmed Kabir", "Fatima Begum", "Rahim Uddin", "Nusrat Jahan", "Karim Sheikh", "Salma Akter"];
const packages = [
    { title: "Premium Hajj Package A", price: 650000, cat: 'Hajj' },
    { title: "Economy Umrah Group", price: 120000, cat: 'Umrah' },
    { title: "Bali Luxury Escape", price: 85000, cat: 'Holiday' },
    { title: "Dubai Family Fun", price: 60000, cat: 'Holiday' },
    { title: "VIP Ramadan Umrah", price: 180000, cat: 'Umrah' }
];

// --- GENERATE BOOKINGS ---
export const generateDummyBookings = (count: number): DummyBooking[] => {
  return Array.from({ length: count }, (_, i) => {
    const pkg = packages[getRandomInt(0, packages.length - 1)];
    const date = new Date();
    date.setDate(date.getDate() - getRandomInt(0, 60)); // Random date in last 60 days

    return {
      id: `BK-${1000 + i}`,
      customerName: names[getRandomInt(0, names.length - 1)],
      packageTitle: pkg.title,
      price: pkg.price,
      travelDate: new Date(date.getTime() + getRandomInt(10, 90) * 86400000).toISOString().split('T')[0], // Future travel date
      status: getRandomStatus(),
      createdAt: date.toISOString(),
    };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first
};

const allBookings = generateDummyBookings(50);

// --- PREPARE CHART DATA ---

// 1. Revenue Trend Data (Last 6 months)
export const getRevenueChartData = (): ChartDataPoint[] => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map(month => {
        const revenue = getRandomInt(500000, 2500000); // Random monthly revenue between 5L to 25L
        const bookings = getRandomInt(10, 50);
        return {
            name: month,
            value: revenue, // Assign revenue to value for chart compatibility
            revenue,
            bookings
        };
    });
};

// 2. Category Distribution Data
export const getCategoryPieData = (): ChartDataPoint[] => {
    return [
        { name: 'Hajj & Umrah', value: getRandomInt(30, 50), color: '#E11D48' }, // Rose-600
        { name: 'Holiday', value: getRandomInt(20, 40), color: '#0EA5E9' },      // Blue-500
        { name: 'Custom', value: getRandomInt(5, 15), color: '#F59E0B' },        // Amber-500
    ];
};

// --- KPI STATS ---
export const dummyStats = {
    totalRevenue: allBookings.reduce((sum, b) => b.status === 'Confirmed' ? sum + b.price : sum, 0),
    pendingRequests: allBookings.filter(b => b.status === 'Pending').length,
    totalBookingsCount: allBookings.length,
    activePackages: 45, // Hardcoded based on your previous inputs
};

export const recentActivity = allBookings.slice(0, 6);