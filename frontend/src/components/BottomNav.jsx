import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Clock3, Home, Network, RefreshCw, Wallet, Megaphone } from "lucide-react";

export default function BottomNav() {
  const location = useLocation();
  
  const items = [
    { icon: Home, label: "Головна", path: "/app/home" },
    { icon: Megaphone, label: "Оголошення", path: "/app/discovery" },
    { icon: RefreshCw, label: "Торгівля", path: "/app/trade" },
    { icon: Network, label: "Рекомендації", path: "/app/recommend" },
    { icon: Wallet, label: "Активи", path: "/app/assets" },
  ];

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 flex justify-center bg-app-bg/95 backdrop-blur-xl border-t border-app-border/5">
      <div className="w-full max-w-[430px] px-5 pt-2 pb-2">
        <div className="grid grid-cols-5 items-end gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-app-muted/60 hover:text-app-text transition-colors"
            >
              <motion.span
                whileHover={{ scale: isActive ? 1 : 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={
                  isActive
                    ? "flex h-14 w-14 items-center justify-center rounded-full bg-nx-lime text-black shadow-glow"
                    : "flex h-8 w-8 items-center justify-center"
                }
              >
                <Icon size={isActive ? 30 : 24} strokeWidth={2.4} />
              </motion.span>
              <span className={isActive ? "font-semibold text-nx-lime" : ""}>{item.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
