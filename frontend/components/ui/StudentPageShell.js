import React from 'react';
import { DashboardLayout } from './DashboardContainer';

const StudentPageShell = ({ sidebar, children, contentClassName = '', sidebarClassName = '' }) => {
  return (
    <DashboardLayout>
      <div className={sidebarClassName}>{sidebar}</div>
      <div className={`w-full md:w-2/3 bg-white flex flex-col min-h-0 ${contentClassName}`}>
        {children}
      </div>
    </DashboardLayout>
  );
};

export default StudentPageShell;