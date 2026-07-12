import React from 'react';
import Badge from '../components/ui/Badge';
import {
  CheckCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  XCircleIcon,
  PencilSquareIcon,
} from '../components/ui/Icons';

export const getStudentElectionBadges = (election) => {
  const badges = [];

  if (election.status === 'active') {
    badges.push(<Badge key="st" variant="success" icon={<CheckCircleIcon className="w-3 h-3" />}>ATTIVA</Badge>);
  } else if (election.status === 'upcoming') {
    badges.push(<Badge key="st" variant="warning" icon={<ClockIcon className="w-3 h-3" />}>PROGRAMMATA</Badge>);
  } else {
    badges.push(<Badge key="st" variant="info" icon={<ArchiveBoxIcon className="w-3 h-3" />}>CONCLUSA</Badge>);
  }

  if (election.userStatus === 'votato') {
    badges.push(<Badge key="us" variant="success" icon={<CheckCircleIcon className="w-3 h-3" />}>INVIATO</Badge>);
  } else if (election.status === 'completed') {
    badges.push(<Badge key="us" variant="error" icon={<XCircleIcon className="w-3 h-3" />}>NON INVIATO</Badge>);
  } else {
    badges.push(<Badge key="us" variant="warning" icon={<PencilSquareIcon className="w-3 h-3" />}>DA VOTARE</Badge>);
  }

  if (election.status === 'active' && election.userStatus !== 'votato') {
    if (election.userStatus === 'registrato') {
      badges.push(<Badge key="vou" variant="info" icon={<CheckCircleIcon className="w-3 h-3" />}>VOUCHER RITIRATO</Badge>);
    } else {
      badges.push(<Badge key="vou" variant="error" icon={<XCircleIcon className="w-3 h-3" />}>VOUCHER DA RITIRARE</Badge>);
    }
  }

  return badges;
};