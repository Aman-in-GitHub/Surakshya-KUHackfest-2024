function daysBetween(currentTimeInMs: number, pastTimeInMs: number): number {
  const differenceInMs = Math.abs(currentTimeInMs - pastTimeInMs);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor(differenceInMs / msPerDay);
}

export default daysBetween;
