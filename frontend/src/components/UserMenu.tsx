'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, User } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut } from 'lucide-react';
import { userMenuItems } from '@/config/navigation';

export function UserMenu() {
  const [user, setUser] = useState<{ name: string; image: string | null; email: string }>({
    name: 'User',
    image: null,
    email: ''
  });
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const payload = await apiClient.getCurrentUser();
        if (payload.success && payload.data?.user) {
          setUser({
            name: payload.data.user.name,
            image: payload.data.user.image,
            email: payload.data.user.email
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // ignore, keep default values
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      router.push('/auth/login');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent/10 transition-colors outline-none">
        {user.image ? (
          <img 
            src={user.image} 
            alt={user.name} 
            className="w-8 h-8 rounded-full object-cover" 
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-gray-200 p-2">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator className="my-2 bg-gray-100" />
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


