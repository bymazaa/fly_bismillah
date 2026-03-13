// app/admin/destinations/edit/page.tsx

import { Suspense } from 'react';

import { Globe, Loader2 } from 'lucide-react';
import EditDestinationForm from './EditDestinationForm';

// ─── Loading Fallback ───
function EditPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="pt-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-xl bg-gray-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-32 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-7 w-48 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-3 w-56 rounded-full bg-gray-100 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-24 rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-10 w-40 rounded-xl bg-gray-300 animate-pulse" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] pb-24">
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100"
              >
                <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                  <div className="h-9 w-9 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                    <div className="h-2.5 w-40 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-11 w-full rounded-xl bg-gray-100 animate-pulse" />
                  <div className="h-11 w-full rounded-xl bg-gray-100 animate-pulse" />
                  {i === 1 && (
                    <div className="h-28 w-full rounded-xl bg-gray-100 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-2xl shadow-gray-100"
              >
                <div className="flex items-center gap-3 border-b border-gray-50 bg-gray-50/40 px-6 py-4">
                  <div className="h-9 w-9 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
                    <div className="h-2.5 w-36 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="h-10 w-full rounded-xl bg-gray-100 animate-pulse" />
                  {i === 3 && (
                    <div className="aspect-[16/10] w-full rounded-xl bg-gray-100 animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Loader */}
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8f9fb]/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200/70 bg-white p-8 shadow-2xl shadow-gray-200">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                <Globe className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[14px] font-bold text-gray-900">Loading Destination</p>
              <p className="text-[12px] text-gray-400 mt-0.5">Fetching data, please wait...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ✅ This is a SERVER component — Suspense works perfectly here
export default function EditDestinationPage() {
  return (
    <Suspense fallback={<EditPageSkeleton />}>
      <EditDestinationForm />
    </Suspense>
  );
}