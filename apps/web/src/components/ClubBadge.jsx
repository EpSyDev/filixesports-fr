
import React from 'react';
import { isOurClub } from '@/utils/identifyOurClub';
import { cleanTeamName } from '@/utils/competitionUtils';
import { cn } from '@/lib/utils';

const ClubBadge = ({ teamName, className, showIcon = true }) => {
  const isOurs = isOurClub(teamName);
  const displayName = cleanTeamName(teamName);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {isOurs && showIcon && (
        <img
          src="/logo.webp"
          alt="KOTIYA FC"
          className="w-5 h-5 rounded-full object-contain shrink-0 ring-1 ring-primary/40"
        />
      )}
      <span
        className={cn(
          "truncate",
          isOurs && "font-bold text-primary"
        )}
      >
        {displayName || 'TBD'}
      </span>
    </span>
  );
};

export default ClubBadge;
