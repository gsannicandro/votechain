import React from 'react';

const AdminInput = ({ label, icon, ...props }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-secondary transition-colors">
        {icon}
      </div>
      <input
        {...props}
        className="block w-full pl-11 pr-4 py-3.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 text-primary focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all sm:text-sm"
      />
    </div>
  </div>
);

export default AdminInput;
