"use client";

import { useState } from "react";
import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { toggleNotificationPanel } = useAppStore();
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/projects?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <header className="h-16 flex items-center gap-4 px-6 border-b border-[var(--surface-border)] bg-[var(--surface-raised)] flex-shrink-0">
      {title && (
        <h1
          className="text-xl font-bold text-[var(--text-primary)] mr-4"
          style={{ fontFamily: "var(--font-dm-serif)" }}
        >
          {title}
        </h1>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--navy-800)] border border-[var(--surface-border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--teal-400)] focus:border-[var(--teal-400)] transition-colors"
          />
        </div>
      </form>

      <div className="flex-1" />

      {/* New Project button */}
      <Button
        onClick={() => router.push("/projects/new")}
        size="sm"
        className="bg-[var(--teal-600)] hover:bg-[var(--teal-500)] text-white border-0"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        New Project
      </Button>

      {/* Notifications */}
      <button
        onClick={toggleNotificationPanel}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {/* Unread indicator */}
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--teal-400)]" />
      </button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors outline-none">
          <div className="w-8 h-8 rounded-full bg-[var(--navy-600)] flex items-center justify-center text-xs font-bold text-[var(--navy-100)]">
            BC
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-[var(--text-primary)]">Beantown PM</div>
            <div className="text-[10px] text-[var(--text-secondary)]">PM Role</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 bg-[var(--navy-800)] border-[var(--surface-border)]"
        >
          <DropdownMenuItem className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[var(--surface-border)]" />
          <DropdownMenuItem className="text-red-400 hover:text-red-300">
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
