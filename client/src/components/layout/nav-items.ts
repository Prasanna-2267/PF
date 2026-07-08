import type { ReactNode } from 'react';
import type { IconProps } from '../ui/icons';
import {
  HomeIcon,
  NotesIcon,
  PracticeIcon,
  TrackerIcon,
  LibraryIcon,
  PackageIcon,
  TagIcon,
  ShieldIcon,
  DashboardIcon,
  UsersIcon,
  WalletIcon,
  MegaphoneIcon,
} from '../ui/icons';

export type NavItem = {
  to: string;
  label: string;
  icon: (props: IconProps) => ReactNode;
  end?: boolean;
};

export const studentNav: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: HomeIcon, end: true },
  { to: '/notes', label: 'Notes', icon: NotesIcon },
  { to: '/practice', label: 'Practice', icon: PracticeIcon },
  { to: '/tracker', label: 'Tracker', icon: TrackerIcon },
  { to: '/library', label: 'Library', icon: LibraryIcon },
];

export const adminNav: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: DashboardIcon, end: true },
  { to: '/admin/students', label: 'Students', icon: UsersIcon },
  { to: '/admin/orders', label: 'Orders', icon: WalletIcon },
  { to: '/admin/content', label: 'Content', icon: NotesIcon },
  { to: '/admin/packages', label: 'Packages', icon: PackageIcon },
  { to: '/admin/coupons', label: 'Coupons', icon: TagIcon },
  { to: '/admin/questions', label: 'Questions', icon: PracticeIcon },
  { to: '/admin/settings', label: 'Broadcast', icon: MegaphoneIcon },
  { to: '/admin/audit', label: 'Audit', icon: ShieldIcon },
];
