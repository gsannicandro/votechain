import React from 'react';
import Image from 'next/image';

const Sidebar = ({ 
  title, 
  description, 
  children,
  icon = "/images/icon.svg",
  logo = "/images/logo.svg" 
}) => (
  <div className="w-full md:w-1/3 bg-primary p-8 md:p-12 text-white flex flex-col relative overflow-hidden">
    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-64 h-64 rounded-full bg-secondary opacity-10 blur-3xl"></div>
    
    <div className="relative z-10 flex items-center mb-12">
      <div className="h-10 w-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center mr-3 border border-white/10">
        <Image src={icon} alt="App Icon" width={28} height={28} />
      </div>
      <div className="hidden sm:block">
        <Image src={logo} alt="App Logo" width={180} height={36} />
      </div>
      <span className="font-bold tracking-tight text-xl sm:hidden uppercase">VoteChain</span>
    </div>

    <div className="relative z-10 my-auto">
      {title && <h2 className="text-3xl font-bold mb-6">{title}</h2>}
      {description && <p className="text-slate-400 leading-relaxed mb-8">{description}</p>}
      {children}
    </div>
  </div>
);

export default Sidebar;
