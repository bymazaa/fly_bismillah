// components/app-sidebar.tsx

'use client';

import * as React from 'react';
import axios from 'axios';
import {
  LogOut,
  Globe,
  Loader2,
  Plane,
  ChevronsUpDown,
  User,
  Settings,
  Shield,
  Monitor,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogOverlay,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { navMain } from '../helper/utlis';

// ==========================================
// Types — ✅ Model অনুযায়ী Fixed
// ==========================================

interface IPermissions {
  dashboard: 'full' | 'view' | 'none';
  booking: 'full' | 'edit' | 'view' | 'none';
  transactions: 'full' | 'edit' | 'view' | 'none';
  customers: 'full' | 'view' | 'none';
  destinations: 'full' | 'view' | 'none' | 'edit';
  packages: 'full' | 'view' | 'none' | 'edit';
  offers: 'full' | 'view' | 'none' | 'edit';
  support: 'full' | 'view' | 'none';
  staff: 'full' | 'view' | 'none';
  settings: 'full' | 'view' | 'none' | 'edit';
  activitylog: 'full' | 'view' | 'none';
  sessions: 'full' | 'view' | 'none';
  profile: 'full' | 'view' | 'none'|'edit';
}

interface IUserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  adminId: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'blocked' | 'suspended';
  isVerified: boolean;
  permissions: IPermissions;
  isTwoFactorEnabled: boolean;
  isOnline: boolean;
  lastLogin: string;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

interface ICurrentSession {
  sessionId: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  loginTime: string;
  lastActive: string;
}

interface IProfileStats {
  totalActiveSessions: number;
  totalLoginHistory: number;
}

// ==========================================
// ✅ Route → Permission Key Map (Model অনুযায়ী)
// ==========================================

const ROUTE_PERMISSION_MAP: Record<string, keyof IPermissions> = {
  '/admin': 'dashboard',
  '/admin/bookings': 'booking',
  '/admin/transactions': 'transactions',
  '/admin/customers': 'customers',
  '/admin/destinations': 'destinations',
  '/admin/packages': 'packages',
  '/admin/offers': 'offers',
  '/admin/support': 'support',
  '/admin/staff': 'staff',
  '/admin/settings': 'settings',
  '/admin/activity-log': 'activitylog',
  '/admin/profile': 'profile',
  '/admin/sessions': 'sessions',
};

// ==========================================
// Helpers
// ==========================================

const avatarColors = [
  'from-blue-600 to-blue-800',
  'from-violet-600 to-violet-800',
  'from-emerald-600 to-emerald-800',
  'from-amber-600 to-amber-800',
  'from-rose-600 to-rose-800',
  'from-sky-600 to-sky-800',
  'from-indigo-600 to-indigo-800',
];

const getAvatarGradient = (name: string): string =>
  avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

const getInitials = (name?: string): string =>
  name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

const getRoleBadge = (
  role: string
): { label: string; color: string; bg: string; dot: string } => {
  switch (role) {
    case 'admin':
      return {
        label: 'Admin',
        color: 'text-blue-700',
        bg: 'bg-blue-50 border-blue-200/60',
        dot: 'bg-blue-500',
      };
    case 'editor':
      return {
        label: 'Editor',
        color: 'text-violet-700',
        bg: 'bg-violet-50 border-violet-200/60',
        dot: 'bg-violet-500',
      };
    case 'viewer':
      return {
        label: 'Viewer',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200/60',
        dot: 'bg-emerald-500',
      };
    default:
      return {
        label: role,
        color: 'text-gray-700',
        bg: 'bg-gray-50 border-gray-200/60',
        dot: 'bg-gray-500',
      };
  }
};

// ✅ Permission check helper — level hierarchy: none < view < edit < full
const hasPermission = (
  user: IUserProfile | null,
  module: keyof IPermissions,
  requiredLevel: 'view' | 'edit' | 'full' = 'view'
): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const permission = user.permissions?.[module];
  if (!permission || permission === 'none') return false;

  const levels = ['none', 'view', 'edit', 'full'];
  return levels.indexOf(permission) >= levels.indexOf(requiredLevel);
};

// ==========================================
// Component
// ==========================================

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();

  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [user, setUser] = React.useState<IUserProfile | null>(null);
  const [currentSession, setCurrentSession] =
    React.useState<ICurrentSession | null>(null);
  const [profileStats, setProfileStats] =
    React.useState<IProfileStats | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  // ── Fetch Profile ──
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingUser(true);
        const response = await axios.get('/api/auth/profile', {
          withCredentials: true,
        });

        if (response.data.success && response.data.data?.profile) {
          setUser(response.data.data.profile);
          setCurrentSession(response.data.data.currentSession || null);
          setProfileStats(response.data.data.stats || null);
        } else {
          throw new Error('Invalid profile response');
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message =
            error.response?.data?.message || error.message;

          console.error('[Sidebar] Profile Error:', message);

          // 401/403 = session invalid → force logout
          if (status === 401 || status === 403) {
            handleForceLogout();
          }
        } else {
          console.error('[Sidebar] Profile Error:', error);
        }
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Force Logout (session invalid) ──
  const handleForceLogout = async () => {
    try {
      await axios.post('/api/auth/logout', {}, { withCredentials: true });
    } catch {
      // Ignore error - just redirect
    } finally {
      router.push('/access');
      router.refresh();
    }
  };

  // ── Logout ──
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await axios.post(
        '/api/auth/logout',
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('Logged out successfully');
        router.push('/access');
        router.refresh();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Logout failed');
      } else {
        toast.error('Logout failed');
      }
      setShowLogoutDialog(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ── Logout All Sessions ──
  const handleLogoutAll = async () => {
    setIsLoggingOut(true);
    try {
      const response = await axios.post(
        '/api/auth/logout',
        { logoutAll: true },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success('All sessions logged out');
        router.push('/access');
        router.refresh();
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Logout failed');
      } else {
        toast.error('Logout failed');
      }
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const initials = getInitials(user?.name);
  const gradient = getAvatarGradient(user?.name || 'A');
  const roleBadge = getRoleBadge(user?.role || 'viewer');

  // ── ✅ Filter nav items based on Model permissions ──
  const filteredNavMain = React.useMemo(() => {
    if (!user) return navMain;

    // Admin sees everything
    if (user.role === 'admin') return navMain;

    // Filter based on permissions
    return navMain
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const permKey = ROUTE_PERMISSION_MAP[item.url];

          // URL mapping না থাকলে dashboard permission check
          if (!permKey) {
            return hasPermission(user, 'dashboard', 'view');
          }

          return hasPermission(user, permKey, 'view');
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        {/* ════════════════════════════════
            HEADER — Logo
        ════════════════════════════════ */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                className="hover:bg-transparent active:bg-transparent"
              >
                <Link
                  href="/admin"
                  className="group/logo group-data-[collapsible=icon]:justify-center"
                >
                  <div className="relative flex aspect-square size-9 items-center justify-center shrink-0 rounded-lg bg-gray-900 shadow-md shadow-gray-900/20 transition-all duration-300 group-hover/logo:scale-105 group-hover/logo:shadow-lg">
                    <Plane className="size-4 text-white transition-transform duration-300 group-hover/logo:-rotate-6" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-extrabold tracking-tight text-sidebar-foreground">
                      FlyBismillah
                    </span>
                    <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                      Admin Panel
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ════════════════════════════════
            CONTENT — Navigation
        ════════════════════════════════ */}
        <SidebarContent className="px-1 py-2">
          {filteredNavMain.map((group) => (
            <SidebarGroup key={group.title} className="mb-1">
              <SidebarGroupLabel className="flex items-center gap-1.5 px-3 mb-0.5 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden">
                {group.title === 'Content Management' && (
                  <Globe className="w-3 h-3" />
                )}
              
                {group.title}
              </SidebarGroupLabel>

              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5 px-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.url === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.url);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="p-0 h-auto w-full outline-none hover:bg-transparent"
                        >
                          <Link
                            href={item.url}
                            className={`
                              group/nav relative flex w-full items-center gap-3 rounded-xl py-2.5 px-3
                              transition-all duration-300 ease-in-out
                              group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center
                              ${
                                isActive
                                  ? '!bg-gray-800 !text-white shadow-md'
                                  : 'text-gray-500 hover:text-gray-900 hover:!bg-gray-200'
                              }
                            `}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gray-400 shadow-[2px_0_8px_rgba(156,163,175,0.6)]" />
                            )}
                            <div
                              className={`
                                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300
                                ${
                                  isActive
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gray-100 text-gray-400 group-hover/nav:bg-white group-hover/nav:text-gray-900 group-hover/nav:shadow-sm'
                                }
                              `}
                            >
                              <item.icon
                                className={`size-4 ${isActive ? 'animate-pulse' : ''}`}
                              />
                            </div>
                            <span
                              className={`
                                text-[13px] tracking-wide truncate transition-all duration-200 group-data-[collapsible=icon]:hidden
                                ${isActive ? 'font-bold' : 'font-medium group-hover/nav:translate-x-0.5'}
                              `}
                            >
                              {item.title}
                            </span>
                            {isActive && (
                              <div className="ml-auto flex items-center group-data-[collapsible=icon]:hidden">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                              </div>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* ════════════════════════════════
            FOOTER — User Profile
        ════════════════════════════════ */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {isLoadingUser ? (
                <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/30 p-2.5 mx-0.5 group-data-[collapsible=icon]:justify-center">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-2.5 w-28 rounded" />
                  </div>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="group/user cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
                    >
                      {/* Avatar with online indicator */}
                      <div className="relative shrink-0">
                        <Avatar className="h-8 w-8 rounded-lg ring-1 ring-sidebar-border/20 transition-transform duration-200 group-hover/user:scale-105">
                          <AvatarImage
                            src={user?.avatar || undefined}
                            alt={user?.name}
                            className="rounded-lg"
                          />
                          <AvatarFallback
                            className={`rounded-lg bg-gradient-to-br ${gradient} text-white text-[11px] font-bold`}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online dot */}
                        {user?.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white" />
                          </span>
                        )}
                      </div>

                      <div className="grid flex-1 text-left text-sm leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold text-sidebar-foreground">
                          {user?.name || 'Admin'}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {user?.email}
                        </span>
                      </div>

                      <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/30 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-xl shadow-gray-200/40"
                    side="bottom"
                    align="end"
                    sideOffset={6}
                  >
                    {/* ── User Info Header ── */}
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10 rounded-lg ring-1 ring-gray-200">
                            <AvatarImage
                              src={user?.avatar || undefined}
                              alt={user?.name}
                              className="rounded-lg"
                            />
                            <AvatarFallback
                              className={`rounded-lg bg-gradient-to-br ${gradient} text-white text-xs font-bold`}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {user?.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                          )}
                        </div>
                        <div className="grid flex-1 text-left leading-tight min-w-0">
                          <span className="truncate text-sm font-bold text-gray-900">
                            {user?.name}
                          </span>
                          <span className="truncate text-[11px] text-gray-500">
                            {user?.email}
                          </span>
                          {/* Role Badge */}
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.bg} ${roleBadge.color}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`}
                              />
                              {roleBadge.label}
                            </span>
                            {user?.isTwoFactorEnabled && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 border border-emerald-200/60 text-emerald-700">
                                <Shield className="w-2.5 h-2.5" />
                                2FA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="my-1.5 bg-gray-100" />

                    {/* ── Menu Items ── */}
                    <DropdownMenuGroup>
                      {/* ✅ Profile — সবাই দেখতে পারবে */}
                      <DropdownMenuItem
                        onClick={() => router.push('/admin/profile')}
                        className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-colors focus:bg-gray-50 focus:text-gray-900"
                      >
                        <User className="mr-2.5 h-4 w-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[13px]">My Profile</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            View & edit your info
                          </span>
                        </div>
                      </DropdownMenuItem>

                      {/* ✅ Sessions — সবাই নিজের sessions দেখতে পারবে */}
                      <DropdownMenuItem
                        onClick={() => router.push('/admin/sessions')}
                        className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-colors focus:bg-gray-50 focus:text-gray-900"
                      >
                        <Monitor className="mr-2.5 h-4 w-4 text-gray-400" />
                        <div className="flex flex-col">
                          <span className="text-[13px] flex items-center gap-2">
                            Active Sessions
                            {profileStats &&
                              profileStats.totalActiveSessions > 1 && (
                                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                  {profileStats.totalActiveSessions}
                                </span>
                              )}
                          </span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {currentSession
                              ? `${currentSession.device} · ${currentSession.browser}`
                              : 'Manage your devices'}
                          </span>
                        </div>
                      </DropdownMenuItem>

                      {/* ✅ Activity Log — permission based */}
                      {hasPermission(user, 'dashboard', 'view') && (
                        <DropdownMenuItem
                          onClick={() => router.push('/admin/activity-log')}
                          className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-colors focus:bg-gray-50 focus:text-gray-900"
                        >
                          <Activity className="mr-2.5 h-4 w-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[13px]">Activity Log</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              View all activities
                            </span>
                          </div>
                        </DropdownMenuItem>
                      )}

                      {/* ✅ Settings — permission based */}
                      {hasPermission(user, 'settings', 'view') && (
                        <DropdownMenuItem
                          onClick={() => router.push('/admin/settings')}
                          className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-gray-700 transition-colors focus:bg-gray-50 focus:text-gray-900"
                        >
                          <Settings className="mr-2.5 h-4 w-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="text-[13px]">Settings</span>
                            <span className="text-[10px] text-gray-400 font-normal">
                              System configuration
                            </span>
                          </div>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-1.5 bg-gray-100" />

                    {/* ── Session Info ── */}
                    {currentSession && (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                            Current Session
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <Monitor className="w-3 h-3 text-gray-300" />
                            <span>
                              {currentSession.device} ·{' '}
                              {currentSession.browser}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            <Globe className="w-3 h-3 text-gray-300" />
                            <span>
                              {currentSession.ip} ·{' '}
                              {currentSession.location}
                            </span>
                          </div>
                        </div>
                        <DropdownMenuSeparator className="my-1.5 bg-gray-100" />
                      </>
                    )}

                    {/* ── Logout Options ── */}
                    <DropdownMenuItem
                      onClick={() => setShowLogoutDialog(true)}
                      className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-rose-600 transition-colors focus:bg-rose-50 focus:text-rose-700"
                    >
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span className="text-[13px]">Sign out</span>
                    </DropdownMenuItem>

                    {profileStats &&
                      profileStats.totalActiveSessions > 1 && (
                        <DropdownMenuItem
                          onClick={handleLogoutAll}
                          disabled={isLoggingOut}
                          className="cursor-pointer rounded-lg px-3 py-2.5 font-medium text-rose-500 transition-colors focus:bg-rose-50 focus:text-rose-700"
                        >
                          <LogOut className="mr-2.5 h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-[13px]">
                              Sign out all devices
                            </span>
                            <span className="text-[10px] text-rose-400 font-normal">
                              {profileStats.totalActiveSessions} active
                              session
                              {profileStats.totalActiveSessions > 1
                                ? 's'
                                : ''}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* ════════════════════════════════
          Logout Dialog
      ════════════════════════════════ */}
      <AlertDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        
      >
     <AlertDialogOverlay className="z-[999] bg-black/40 backdrop-blur-sm" />
<AlertDialogContent className="z-[999] max-w-[360px] rounded-2xl border-0 p-0 shadow-2xl shadow-black/20 overflow-hidden gap-0 animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Top Section */}
          <div className="relative bg-gradient-to-b from-gray-50 to-white px-6 pt-7 pb-5 z-50">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60" />
            <div className="absolute top-4 right-8 w-8 h-8 bg-rose-100 rounded-full opacity-40" />

            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 shadow-sm ring-1 ring-rose-200/60">
                <LogOut className="h-5 w-5 text-rose-500" />
              </div>

              <AlertDialogHeader className="mt-4 space-y-1.5 text-left">
                <AlertDialogTitle className="text-[17px] font-extrabold tracking-tight text-gray-900">
                  Sign out of your account?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[12.5px] leading-relaxed text-gray-400">
                  You&apos;ll be signed out of{' '}
                  <span className="font-semibold text-gray-500">
                    {user?.email}
                  </span>{' '}
                  and will need to enter your credentials again.
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Current session info */}
              {currentSession && (
                <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                  <Monitor className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-[11px] text-gray-500 truncate">
                    {currentSession.device} · {currentSession.browser}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="px-5 py-4 bg-gray-50/80 border-t border-gray-100">
            <AlertDialogFooter className="gap-2.5 sm:gap-2.5">
              <AlertDialogCancel
                className="cursor-pointer flex-1 h-10 rounded-lg border-gray-200 bg-white text-[13px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all shadow-sm"
                disabled={isLoggingOut}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="cursor-pointer flex-1 h-10 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-[13px] font-bold text-white shadow-md shadow-rose-500/25 hover:from-rose-600 hover:to-rose-700 transition-all duration-200 active:scale-[0.97] border-0"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Signing out…
                  </span>
                ) : (
                  'Sign out'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}