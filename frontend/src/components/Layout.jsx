import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout() {
  return (
    <main className="min-h-screen bg-app-bg text-app-text selection:bg-nx-lime/30">
      <div 
        className="mx-auto min-h-screen flex flex-col w-full max-w-[430px] overflow-hidden bg-app-bg px-5 relative pb-28"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}
      >
        <div className="absolute top-0 left-[-100px] w-64 h-64 bg-nx-blue/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex-1 relative z-10 flex flex-col">
          <Outlet />
        </div>
        
        <BottomNav />
      </div>
    </main>
  );
}
