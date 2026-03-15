import AdminGuard from '@/components/AdminGuard';
import AdminNav from '@/components/AdminNav';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Admin – DRK Spendenquittung',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminNav />
      <div className="py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </div>
    </AdminGuard>
  );
}
