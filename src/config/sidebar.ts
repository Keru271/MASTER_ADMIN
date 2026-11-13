export interface SidebarItem {
  id?: string;
  title: string;
  label: string;
  name?: string;
  href: string;
  path: string;
  icon?: string;
  children?: SidebarItem[];
  items?: SidebarItem[];
}

export const sidebarConfig: SidebarItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    label: 'Dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    path: '/dashboard',
    icon: 'dashboard',
  },
  {
    id: 'customer',
    title: 'Customer',
    label: 'Customer',
    name: 'Customer',
    href: '/customers',
    path: '/customers',
    icon: 'users',
  },
  {
    id: 'orders',
    title: 'Orders',
    label: 'Orders',
    name: 'Orders',
    href: '/orders',
    path: '/orders',
    icon: 'shopping-cart',
  },
  {
    id: 'products',
    title: 'Products',
    label: 'Products',
    name: 'Products',
    href: '/products',
    path: '/products',
    icon: 'box',
  },
  {
    id: 'settings',
    title: 'Settings',
    label: 'Settings',
    name: 'Settings',
    href: '/settings',
    path: '/settings',
    icon: 'settings',
  },
];

export const sidebarItems = sidebarConfig;
export const sidebarMenu = sidebarConfig;
export const navItems = sidebarConfig;

export default sidebarConfig;
