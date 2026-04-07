"use client";

import { X, Bell, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const mockNotifications = [
  {
    id: "1",
    type: "bid_received",
    title: "New Bid Received",
    message: "Summit General Contracting submitted a bid for 14 Maple Avenue",
    link: "/projects/1/bids",
    read: false,
    createdAt: new Date(Date.now() - 12 * 60 * 1000),
  },
  {
    id: "2",
    type: "ai_scored",
    title: "AI Scoring Complete",
    message: "3 bids for 47 Riverbend Drive have been scored. Recommendation ready.",
    link: "/projects/2/compare",
    read: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
  },
  {
    id: "3",
    type: "bid_deadline",
    title: "Bid Deadline Tomorrow",
    message: "14 Maple Avenue — 2 contractors haven't responded yet",
    link: "/projects/1",
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
];

const iconMap: Record<string, React.ReactNode> = {
  bid_received: <CheckCircle2 className="w-4 h-4 text-[var(--teal-400)]" />,
  ai_scored: <Info className="w-4 h-4 text-[var(--purple-400)]" />,
  bid_deadline: <AlertCircle className="w-4 h-4 text-[var(--amber-500)]" />,
};

export function NotificationPanel() {
  const { notificationPanelOpen, setNotificationPanelOpen } = useAppStore();

  return (
    <>
      <AnimatePresence>
        {notificationPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setNotificationPanelOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-[var(--surface-raised)] border-l border-[var(--surface-border)] z-40 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--surface-border)]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[var(--teal-400)]" />
                  <span className="font-semibold text-[var(--text-primary)]">Notifications</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[var(--teal-600)] text-[var(--teal-400)] text-xs font-mono">
                    {mockNotifications.filter((n) => !n.read).length}
                  </span>
                </div>
                <button
                  onClick={() => setNotificationPanelOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {mockNotifications.map((notification) => (
                  <a
                    key={notification.id}
                    href={notification.link}
                    onClick={() => setNotificationPanelOpen(false)}
                    className={cn(
                      "flex gap-3 px-4 py-3.5 border-b border-[var(--surface-border)] hover:bg-[rgba(255,255,255,0.03)] transition-colors",
                      !notification.read && "bg-[rgba(93,202,165,0.04)]"
                    )}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {iconMap[notification.type] ?? <Bell className="w-4 h-4 text-[var(--text-secondary)]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium",
                            notification.read
                              ? "text-[var(--text-secondary)]"
                              : "text-[var(--text-primary)]"
                          )}
                        >
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-[var(--teal-400)] flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1 font-mono opacity-70">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </a>
                ))}
              </div>

              <div className="px-4 py-3 border-t border-[var(--surface-border)]">
                <button className="w-full text-center text-xs text-[var(--teal-400)] hover:text-[var(--teal-300)] transition-colors">
                  Mark all as read
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
