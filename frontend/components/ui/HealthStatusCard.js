import React from 'react';
import Card from './Card';
import Badge from './Badge';
import StatusMessage from './StatusMessage';

const HealthStatusCard = ({ health, error }) => {
  const renderServiceStatus = (serviceName, serviceData) => {
    const status = String(serviceData?.status || 'unknown').toLowerCase();
    const isOk = status === 'connected';
    const isDegraded = status === 'degraded';
    
    let badgeVariant = 'default';
    if (isOk) badgeVariant = 'success';
    else if (isDegraded) badgeVariant = 'warning';
    else badgeVariant = 'error';

    return (
      <div key={serviceName} className="flex items-center justify-between p-3 bg-bgpage rounded-xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isOk ? 'bg-success' : isDegraded ? 'bg-warning' : 'bg-error'}`}></div>
          <div>
            <p className="text-sm font-bold text-charcoal">{serviceData.name || serviceName}</p>
              <p className="text-xs text-slate/70">
              {serviceData.latencyMs ? `${serviceData.latencyMs} ms` : (serviceData.message || '')}
              </p>
          </div>
        </div>
        <Badge variant={badgeVariant}>{status.toUpperCase()}</Badge>
      </div>
    );
  };

  return (
    <Card title="Stato dei Servizi">
      {error && (
          <div className="mb-4">
            <StatusMessage type="error" message="Impossibile contattare il server di health check." />
          </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {health && Object.entries(health.services || {})
          .filter(([k, s]) => {
            if (!s) return false;
            if (/pgadmin/i.test(k) || (s.name && /pgadmin/i.test(String(s.name)))) return false;
            return true;
          })
          .map(([k, s]) => renderServiceStatus(k, s))
        }
      </div>
    </Card>
  );
};

export default HealthStatusCard;
