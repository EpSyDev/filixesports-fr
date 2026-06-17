
export const isOurClub = (teamName) => {
  if (!teamName) return false;
  return teamName.trim().toLowerCase() === 'filix';
};
