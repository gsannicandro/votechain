import React from 'react';

export const DashboardLayout = ({ children }) => (
  <div className="min-h-screen bg-bgpage flex items-center justify-center p-4 font-sans text-slate">
    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col md:flex-row min-h-[700px]">
      {children}
    </div>
  </div>
);

