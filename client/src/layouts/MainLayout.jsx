import { Outlet, NavLink, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  const location = useLocation();

  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
      )
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      )
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: (active) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Top Navbar - Always visible */}
      <div className="sticky top-0 z-30">
        <Navbar />
      </div>

      <main className="container mx-auto px-4 py-4 lg:py-8 flex-1 mb-20 lg:mb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-base-100/90 backdrop-blur-lg border-t border-base-200 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative
                   ${isActive ? 'text-primary' : 'text-base-content/50 hover:text-base-content/70'}`
                }
              >
                {item.icon(isActive)}
                
                <span className={`text-[10px] font-medium transition-all ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-100'}`}>
                  {item.label}
                </span>
                
                {/* Active Indicator Bar */}
                {isActive && (
                   <span className="absolute top-0 w-12 h-0.5 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(var(--p),0.5)]"></span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
