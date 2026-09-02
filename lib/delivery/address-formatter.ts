export interface StructuredAddressInput {
  flatBuilding: string;
  street: string;
  landmark?: string | null;
  area: string;
  pincode: string;
}

/**
 * Combines structured address fields into a single well-formatted address string.
 * Example: "Flat 302, Sunshine Heights, 90 Feet Road, Near Garodia Hospital, Demo City East, Mumbai - 400077"
 */
export function formatStructuredAddress(input: StructuredAddressInput): string {
  const parts: string[] = [];

  if (input.flatBuilding && input.flatBuilding.trim()) {
    parts.push(input.flatBuilding.trim());
  }
  if (input.street && input.street.trim()) {
    parts.push(input.street.trim());
  }
  if (input.landmark && input.landmark.trim()) {
    // Avoid double "Near" if user typed "Near XYZ"
    const landmarkText = input.landmark.trim();
    if (/^near\s+/i.test(landmarkText)) {
      parts.push(landmarkText);
    } else {
      parts.push(`Near ${landmarkText}`);
    }
  }
  if (input.area && input.area.trim()) {
    parts.push(input.area.trim());
  }

  const mainAddress = parts.join(', ');
  const pincodeStr = input.pincode ? input.pincode.trim() : '';

  return pincodeStr ? `${mainAddress}, Mumbai - ${pincodeStr}` : `${mainAddress}, Mumbai`;
}
