export type LatLng = { lat: number; lng: number };

export const PROVINCE_CENTERS: Record<string, LatLng> = {
  "Aceh": { lat: 5.5483, lng: 95.3238 },
  "Sumatera Utara": { lat: 3.5952, lng: 98.6722 },
  "Sumatera Barat": { lat: -0.9471, lng: 100.4172 },
  "Riau": { lat: 0.5071, lng: 101.4478 },
  "Kepulauan Riau": { lat: 0.9186, lng: 104.4665 },
  "Jambi": { lat: -1.6101, lng: 103.6131 },
  "Sumatera Selatan": { lat: -2.9909, lng: 104.7566 },
  "Kepulauan Bangka Belitung": { lat: -2.1296, lng: 106.1136 },
  "Bengkulu": { lat: -3.7956, lng: 102.2592 },
  "Lampung": { lat: -5.4294, lng: 105.2625 },
  "DKI Jakarta": { lat: -6.2088, lng: 106.8456 },
  "Jawa Barat": { lat: -6.9175, lng: 107.6191 },
  "Banten": { lat: -6.1201, lng: 106.1503 },
  "Jawa Tengah": { lat: -6.9667, lng: 110.4167 },
  "DI Yogyakarta": { lat: -7.7956, lng: 110.3695 },
  "Jawa Timur": { lat: -7.2575, lng: 112.7521 },
  "Bali": { lat: -8.65, lng: 115.2167 },
  "Nusa Tenggara Barat": { lat: -8.5833, lng: 116.1167 },
  "Nusa Tenggara Timur": { lat: -10.1718, lng: 123.6075 },
  "Kalimantan Barat": { lat: -0.0263, lng: 109.3425 },
  "Kalimantan Tengah": { lat: -2.21, lng: 113.9213 },
  "Kalimantan Selatan": { lat: -3.3186, lng: 114.5944 },
  "Kalimantan Timur": { lat: -0.5021, lng: 117.1536 },
  "Kalimantan Utara": { lat: 2.8375, lng: 117.3653 },
  "Sulawesi Utara": { lat: 1.4748, lng: 124.8421 },
  "Gorontalo": { lat: 0.5435, lng: 123.0568 },
  "Sulawesi Tengah": { lat: -0.8917, lng: 119.8707 },
  "Sulawesi Barat": { lat: -2.6786, lng: 118.8869 },
  "Sulawesi Selatan": { lat: -5.1477, lng: 119.4327 },
  "Sulawesi Tenggara": { lat: -3.9985, lng: 122.5124 },
  "Maluku": { lat: -3.6954, lng: 128.1814 },
  "Maluku Utara": { lat: 0.7325, lng: 127.55 },
  "Papua": { lat: -2.5337, lng: 140.7181 },
  "Papua Barat": { lat: -0.8615, lng: 134.0788 },
};

export function getProvinceCenter(province: string | null | undefined) {
  if (!province) return null;
  return PROVINCE_CENTERS[province] ?? null;
}
