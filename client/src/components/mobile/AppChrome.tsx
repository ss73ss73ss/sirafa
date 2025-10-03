import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Home, ArrowLeftRight, ShoppingCart, Wallet, Settings, Plus, Building2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useOrientationMode } from '@/hooks/useOrientationMode';

interface AppChromeProps {
  children: ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { isAndroidAppMode } = useOrientationMode();
  

  // Bottom navigation tabs
  const bottomTabs = [
    {
      id: 'home',
      label: 'الرئيسية',
      icon: Home,
      path: '/dashboard',
      active: location === '/dashboard' || location === '/'
    },
    {
      id: 'internal-transfer',
      label: 'تحويل داخلي',
      icon: ArrowLeftRight,
      path: '/internal-transfer',
      active: location === '/internal-transfer'
    },
    {
      id: 'city-transfers',
      label: 'المدن',
      icon: Building2,
      path: '/city-transfers',
      active: location === '/city-transfers'
    },
    {
      id: 'inter-office-transfer',
      label: 'دولي',
      icon: Globe,
      path: '/office-management',
      active: location === '/office-management'
    },
    {
      id: 'market',
      label: 'السوق',
      icon: ShoppingCart,
      path: '/market',
      active: location === '/market'
    },
    {
      id: 'wallet',
      label: 'المحفظة',
      icon: Wallet,
      path: '/balance',
      active: location === '/balance'
    }
  ];

  // Don't render if not in Android app mode
  if (!isAndroidAppMode) {
    return <>{children}</>;
  }

  return (
    <div className="android-app-container h-screen flex flex-col bg-background">
      {/* Main Content */}
      <main className="flex-1 pb-12 sm:pb-20 overflow-auto scrollbar-hide">
        <div className="safe-area-content min-h-full px-0.5 sm:px-2 py-0.5 sm:py-2 bg-[000000]">
          {children}
        </div>
      </main>
      {/* Bottom Navigation */}
      <nav className="bottom-nav bg-background/98 backdrop-blur-md border-t border-border/40 fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-12 sm:h-20 px-0.5 safe-area-bottom shadow-xl">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className="whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex flex-col items-center justify-center gap-0.5 sm:gap-1 h-full min-w-0 flex-1 rounded-lg mx-0.5 py-0.5 sm:py-1.5 px-0.5 transition-all duration-300 active:scale-95 touch-manipulation text-muted-foreground hover:text-foreground hover:bg-muted/50 active:bg-muted/70 bg-[#ff9900]"
              onClick={() => setLocation(tab.path)}
            >
              <Icon className={`${tab.active ? 'h-2.5 w-2.5 sm:h-4 sm:w-4' : 'h-2 w-2 sm:h-3.5 sm:w-3.5'} transition-all duration-300`} />
              <span className={`text-[7px] sm:text-[10px] font-medium truncate leading-tight max-w-full text-center ${tab.active ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}