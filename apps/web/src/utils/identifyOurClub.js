
export const isOurClub = (teamName) => {
  if (!teamName) return false;
  return /\bkotiya\b/i.test(teamName);
};
