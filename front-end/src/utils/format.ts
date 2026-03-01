export function formatTimestamp(iso: string): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateMiddle(value: string | null | undefined, head = 6, tail = 6): string {
  if (!value) return "Not available";
  if (value.length <= head + tail + 3) return value;
  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}
