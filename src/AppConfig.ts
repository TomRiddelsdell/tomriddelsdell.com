import { AppAccessScope } from './AppAccessScope'

export const availableApps = [
  {
    id: 'to-do',
    name: 'To Do List',
    description: 'app for managing your to do list',
    link: '/apps/to-do',
    path: '/apps/to-do/to-do.tsx',
    css: './css/to-do-1.css',
    className: 'to-do',
    access: AppAccessScope.byUser,
  },
  {
    id: 'dummy-public',
    name: 'Dummy Publically Accessible App',
    description: 'This is App Two',
    link: '/apps/dummy-public',
    path: '/apps/dummy-public/dummy-public.tsx',
    css: './css/dummy-public-1.css',
    className: 'dummy-public',
  },
  // Add more apps as needed
];

export function appConfig(appId: string) {
  return availableApps.find((app) => app.id === appId);
} 

export function exportCss() {
  return availableApps.map((app) => import(`${app.css}`));
}