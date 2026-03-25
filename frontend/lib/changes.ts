export type ChangeItem = {
  type: "new" | "rising";
  message: string;
};

export function generateChanges(
  newSignalsToday: unknown[],
  rising: Array<{ score: number }>,
): ChangeItem[] {
  const changes: ChangeItem[] = [];

  if (newSignalsToday.length > 0) {
    changes.push({
      type: "new",
      message: `${newSignalsToday.length} new signal${newSignalsToday.length === 1 ? "" : "s"} detected today`,
    });
  }

  if (rising.length > 2) {
    changes.push({
      type: "rising",
      message: "Multiple high-impact signals emerging",
    });
  }

  return changes;
}
