
import React from 'react';
import { Shield } from 'lucide-react';
import { isOurClub } from '@/utils/identifyOurClub';
import { cleanTeamName } from '@/utils/competitionUtils';
import { cn } from '@/lib/utils';

const ClubBadge = ({ teamName, className, showIcon = true }) => {
  const isOurs = isOurClub(teamName);
  const displayName = cleanTeamName(teamName);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {isOurs && showIcon && <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
      <span 
        className={cn(
          "truncate",
          isOurs && "font-bold text-blue-700 dark:text-blue-400"
        )}
      >
        {displayName || 'TBD'}
      </span>
    </span>
  );
};

export default ClubBadge;
