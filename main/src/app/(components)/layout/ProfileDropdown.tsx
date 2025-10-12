import React, { useState, useEffect } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as UserIcon, Settings, LogOut, ChevronDown, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "../entities/User";

export default function ProfileDropdown() {
  const [currentUser, setCurrentUser] = useState<null | {
    id?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  }>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();          // should return user or throw 401
        setCurrentUser(me ?? null);
      } catch (err: any) {
        // If unauthenticated, ensure we are in "guest" state
        if (err?.status === 401) setCurrentUser(null);
        else console.error("Error loading user data:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (e) {
      console.error("Error logging out:", e);
    } finally {
      router.refresh();
    }
  };

  const getInitials = (name?: string) =>
    name?.split(/\s+/).map(n => n[0]).join("").toUpperCase() || "U";

  if (isLoading) {
    return <div className="w-32 h-10 bg-slate-200 rounded-xl animate-pulse" />;
  }

  const isGuest = !currentUser?.id; 

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-100/60 hover:bg-slate-200/60 rounded-xl cursor-pointer transition-colors">
          {isGuest ? (
            <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full
                            flex items-center justify-center text-white font-medium text-sm">
              G
            </div>
          ) : currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.full_name ?? "User avatar"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full
                            flex items-center justify-center text-white font-medium text-sm">
              {getInitials(currentUser?.full_name)}
            </div>
          )}

          <span className="hidden sm:block text-sm font-medium text-slate-700">
            {isGuest ? "Guest" : currentUser?.full_name?.split(" ")[0] ?? "User"}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-xl border-slate-200/60" align="end">
        {isGuest ? (
          <>
            <DropdownMenuLabel className="px-3 py-2">
              <div className="text-sm text-slate-500">Guest User</div>
              <div className="text-xs text-slate-500">Not signed in</div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-200/60" />

            <DropdownMenuItem asChild className="px-3 py-2 hover:bg-slate-100/60 cursor-pointer">
              <Link href="/signIn">
                <LogIn className="w-4 h-4 mr-3" />
                Sign In
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="px-3 py-2 hover:bg-slate-100/60 cursor-pointer">
              <Link href="/signUp">
                <UserPlus className="w-4 h-4 mr-3" />
                Create Account
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="px-3 py-2">
              <div className="text-sm text-slate-500">Signed in as</div>
              <div className="font-medium text-slate-900 truncate">{currentUser?.full_name}</div>
              <div className="text-xs text-slate-500 truncate">{currentUser?.email}</div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-slate-200/60" />

            <DropdownMenuItem asChild className="px-3 py-2 hover:bg-slate-100/60 cursor-pointer">
              <Link href="/profile">
                <UserIcon className="w-4 h-4 mr-3 text-slate-500" />
                View Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild className="px-3 py-2 hover:bg-slate-100/60 cursor-pointer">
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-3 text-slate-500" />
                Settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-200/60" />

            <DropdownMenuItem
              className="px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
