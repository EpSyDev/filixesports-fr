
export const isOurClub = (teamName) => {
  if (!teamName) return false;
  return /\bfilix\b/i.test(teamName);
};
