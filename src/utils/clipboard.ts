import { showToast } from "./toast";

export async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    showToast("Copied");
  } catch {
    showToast("Copy failed");
  }
}
