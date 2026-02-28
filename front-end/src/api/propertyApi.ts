import type { Property, RegisterPropertyResult } from "../types/property";

const STORAGE_KEY = "deedlock_holmes_properties_v1";

const SAMPLE_ADDRESSES = [
  "1428 Harbor View Dr, San Diego, CA",
  "85 W 12th St, New York, NY",
  "774 Orchard Grove Ln, Austin, TX",
  "39 Riverbank Ave, Miami, FL",
  "226 Cedar Ridge Rd, Denver, CO",
];

const SAMPLE_OWNERS = [
  "Olivia Carter",
  "Noah Mitchell",
  "Ethan Brooks",
  "Sophia Nguyen",
  "Mia Reynolds",
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readProperties(): Property[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Property[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProperties(items: Property[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function makeMockProperty(): Property {
  const confidenceScore = randomInt(72, 99);
  const fraudRoll = Math.random();
  const fraudRisk =
    fraudRoll > 0.83 ? "High" : fraudRoll > 0.56 ? "Medium" : "Low";
  const id = crypto.randomUUID();
  const accountAddress = `Deed${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
  const timestamp = new Date().toISOString();

  return {
    id,
    address: pick(SAMPLE_ADDRESSES),
    owner: pick(SAMPLE_OWNERS),
    confidenceScore,
    fraudRisk,
    timestamp,
    accountAddress,
    explorerUrl: `https://explorer.example.com/address/${accountAddress}`,
    transferCount: randomInt(0, 4),
  };
}

export async function registerProperty(file: File): Promise<RegisterPropertyResult> {
  await delay(3500);

  if (file.size > 10 * 1024 * 1024) {
    return {
      status: "rejected",
      error: "File exceeds 10MB size limit.",
    };
  }

  const mock = makeMockProperty();

  if (mock.fraudRisk === "High" || mock.confidenceScore < 80) {
    return {
      status: "rejected",
      error:
        "Authenticity checks failed due to elevated fraud indicators and metadata mismatch.",
    };
  }

  const current = readProperties();
  const next = [mock, ...current];
  saveProperties(next);

  return { status: "success", data: mock };
}

export async function getAllProperties(): Promise<Property[]> {
  await delay(1000);
  const records = readProperties();
  return records.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}
