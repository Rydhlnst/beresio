export type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type ParsedAddress = {
  formattedAddress?: string;
  placeId?: string;
  alamatLengkap: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  kodePos: string;
  provinsi: string;
};

function getComponent(
  components: GoogleAddressComponent[] | undefined,
  type: string
) {
  if (!components) return null;
  return components.find((component) => component.types.includes(type)) ?? null;
}

export function parseAddressComponents(
  components: GoogleAddressComponent[] | undefined,
  formattedAddress?: string
): ParsedAddress {
  const route = getComponent(components, "route")?.long_name ?? "";
  const streetNumber = getComponent(components, "street_number")?.long_name ?? "";
  const locality =
    getComponent(components, "locality")?.long_name ??
    getComponent(components, "administrative_area_level_2")?.long_name ??
    "";
  const kecamatan =
    getComponent(components, "sublocality_level_1")?.long_name ?? "";
  const kelurahan =
    getComponent(components, "sublocality_level_2")?.long_name ?? "";
  const kodePos = getComponent(components, "postal_code")?.long_name ?? "";
  const provinsi =
    getComponent(components, "administrative_area_level_1")?.long_name ?? "";

  const jalan = [route, streetNumber].filter(Boolean).join(" ").trim();
  const alamatLengkap = jalan || formattedAddress || "";

  return {
    formattedAddress,
    alamatLengkap,
    kota: locality,
    kecamatan,
    kelurahan,
    kodePos,
    provinsi,
  };
}

export function isCoordinateInIndonesia(lat: number, lng: number) {
  return lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141;
}
