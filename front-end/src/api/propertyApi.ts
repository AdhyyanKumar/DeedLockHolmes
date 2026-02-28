import type { Property, RegisterPropertyResult } from "../types/property";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function registerProperty(
  file: File,
  propertyAddress: string,
  ownerName: string,
): Promise<RegisterPropertyResult> {
  if (file.size > 10 * 1024 * 1024) {
    return {
      status: "rejected",
      error: "File exceeds 10MB size limit.",
    };
  }

  const formData = new FormData();
  formData.append("deed", file);
  formData.append("property_address", propertyAddress);
  formData.append("owner_name", ownerName);

  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 401) {
    return {
      status: "rejected",
      error: "Login required before registering a property.",
    };
  }

  if (!response.ok) {
    return {
      status: "rejected",
      error: payload?.error || "Registration failed.",
    };
  }

  return { status: "success", data: payload?.property as Property };
}

export async function getAllProperties(): Promise<Property[]> {
  const response = await fetch(`${API_BASE_URL}/properties`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Failed to load properties with ${response.status}`);
  }

  const payload = (await response.json()) as { items: Property[] };
  return payload.items;
}
