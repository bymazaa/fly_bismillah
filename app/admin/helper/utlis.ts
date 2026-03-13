// Menu Configuration (Static Items)
import {
    LayoutDashboard,
    Plane,
    CreditCard,
    LifeBuoy,
    MapPin,
    TicketPercent,
    Book,
    UsersRound,
    UserStar,
    CircleUser,
    Blocks,
    Info
} from 'lucide-react';

export const navMain = [
    {
        title: 'Platform',
        items: [
            { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
            { title: 'Flight Bookings', url: '/admin/bookings', icon: Plane },
            { title: 'Customers', url: '/admin/customers', icon: UserStar  },
            { title: 'Transactions', url: '/admin/transactions', icon: CreditCard },
        ],
    },
    {
        title: 'Content Management',
        items: [
            { title: 'Tour Packages', url: '/admin/packages', icon: Blocks  },
            { title: 'Destinations', url: '/admin/destinations', icon: MapPin },
            { title: 'Special Offers', url: '/admin/offers', icon: TicketPercent },
        ],
    },
    {
        title: 'Others',
        items: [
            { title: 'Profile', url: '/admin/profile', icon: CircleUser   },
            { title: 'Staff Manage', url: '/admin/staff', icon: UsersRound  },
            { title: 'Support', url: '/admin/support', icon: LifeBuoy },
            { title: 'Project Snapshot', url: '/admin/doc', icon: Info },
        ],
    },
];
