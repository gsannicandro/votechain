import React from 'react';

export const InputField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  icon, 
  required = false,
  rightElement = null,
  variant = 'default',
  className = ''
}) => {
  const styles = {
    default: {
      input: "bg-slate-50 border-slate-200 focus:border-secondary focus:ring-secondary/10",
      icon: "text-slate-400",
      iconFocus: ""
    },
    admin: {
      input: "bg-white border-slate-200 focus:border-secondary focus:ring-secondary/20",
      icon: "text-slate-400",
      iconFocus: "group-focus-within:text-secondary"
    }
  };

  const currentStyle = styles[variant] || styles.default;
  const isIconString = typeof icon === 'string';

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${currentStyle.icon} ${currentStyle.iconFocus}`}>
            {isIconString ? <i className={icon}></i> : icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          className={`
            block w-full py-3.5 rounded-xl leading-5 sm:text-sm border transition-all duration-200 focus:outline-none focus:ring-2
            ${icon ? 'pl-11' : 'pl-4'} 
            ${rightElement ? 'pr-10' : 'pr-4'} 
            ${currentStyle.input}
            placeholder-slate-400 text-primary
          `}
          placeholder={placeholder}
          required={required}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export default InputField;
