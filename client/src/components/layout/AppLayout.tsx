import { Outlet } from 'react-router-dom';
import { Container } from './Container';
import { SidebarNav } from './SidebarNav';
import { BottomNav } from './BottomNav';
import { MobileTopBar } from './MobileTopBar';

/** Student app shell: desktop sidebar + mobile top bar & bottom tabs. */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-canvas">
      <SidebarNav />
      <MobileTopBar />
      <main className="lg:pl-64">
        <Container className="animate-fade-in py-5 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:py-8 lg:pb-12">
          <Outlet />
        </Container>
      </main>
      <BottomNav />
    </div>
  );
}
