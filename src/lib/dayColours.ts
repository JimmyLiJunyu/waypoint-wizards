export const DAY_COLOURS = [
    "#EF4444", // red    - day 1
    "#3B82F6", // blue   - day 2
    "#10B981", // green  - day 3
    "#F59E0B", // amber  - day 4
    "#8B5CF6", // purple - day 5
    "#EC4899", // pink   - day 6
    "#06B6D4", // cyan   - day 7
  ];
  
  export function getDayColour(dayNumber: number): string {
    return DAY_COLOURS[(dayNumber - 1) % DAY_COLOURS.length];
  }