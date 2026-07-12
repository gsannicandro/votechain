// frontend/components/ui/ElectionCard.js
import React from 'react';

const ElectionCard = ({ 
  title, 
  description, 
  startDate, 
  endDate, 
  isActive, 
  iconColor, 
  badges, // Array di componenti Badge
  mainIcon // Componente SVG opzionale
}) => {
  return (
    <div className={`group border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-secondary/10 transition-all cursor-pointer bg-white relative ${!isActive ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-5">
        {/* Icona Box */}
        <div className={`p-4 rounded-xl border border-gray-100 transition-colors ${!isActive ? 'bg-gray-50' : 'bg-bgpage group-hover:bg-secondary-bg/20'}`}>
          <div className={`w-7 h-7 ${iconColor}`}>
             {mainIcon}
          </div>
        </div>
        
        <div className="flex-1">
          {/* Badge Section */}
          <div className="flex flex-wrap gap-2 mb-3">
            {badges}
          </div>
          
          {/* Content Section */}
          <h4 className="text-lg font-bold text-primary mb-1 group-hover:text-secondary transition-colors">
            {title}
          </h4>
          <p className="text-sm text-slate mb-4 line-clamp-2">
            {description || "Nessuna descrizione disponibile."}
          </p>
          
          {/* Footer/Date Section */}
          <div className="flex items-center gap-4 text-[11px] text-slate/50 font-medium">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Inizio: {startDate}
            </span>
            <span className={`flex items-center gap-1 font-bold ${isActive ? 'text-charcoal' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Scadenza: {endDate}
            </span>
          </div>
        </div>

        {/* Chevron Arrow */}
        <div className="self-center">
          <svg className="w-5 h-5 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ElectionCard;