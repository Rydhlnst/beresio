"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { cn } from "@/lib/utils";
import { useGooglePlaces, type PlacesPrediction } from "@/hooks/use-google-places";
import { isCoordinateInIndonesia, parseAddressComponents } from "@/lib/places";
import { getProvinceCenter } from "@/lib/province-centers";
import regions from "@/data/indonesia-regions.json";
import { Search, X } from "lucide-react";

const branchSchema = z
  .object({
    namaCabang: z.string().min(1, "Nama cabang wajib diisi"),
    provinsi: z.string().min(1, "Provinsi wajib dipilih"),
    kota: z.string().min(1, "Kota/area wajib diisi"),
    alamatLengkap: z.string().min(8, "Alamat lengkap minimal 8 karakter"),
    kecamatan: z.string().optional().nullable(),
    kelurahan: z.string().optional().nullable(),
    kodePos: z.string().optional().nullable(),
    nomorTelepon: z.string().min(6, "Nomor telepon wajib diisi"),
    googlePlaceId: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    inputMethod: z.enum(["autocomplete", "manual"]),
  })
  .superRefine((value, ctx) => {
    if (value.latitude !== null || value.longitude !== null) {
      if (value.latitude === null || value.longitude === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Koordinat tidak lengkap",
          path: ["latitude"],
        });
        return;
      }
      if (!isCoordinateInIndonesia(value.latitude, value.longitude)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Koordinat di luar wilayah Indonesia",
          path: ["latitude"],
        });
      }
    }
  });

type BranchFormValues = z.infer<typeof branchSchema>;

export type BranchPayload = {
  nama_cabang: string;
  provinsi: string;
  kota: string;
  alamat_lengkap: string;
  kecamatan: string | null;
  kelurahan: string | null;
  kode_pos: string | null;
  nomor_telepon: string;
  metadata: {
    google_place_id: string | null;
    koordinat: { lat: number; lng: number } | null;
    input_method: "autocomplete" | "manual";
  };
};

export type BranchFormProps = {
  onSubmit?: (payload: BranchPayload) => Promise<void> | void;
  defaultValues?: Partial<BranchFormValues>;
  isSubmitting?: boolean;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const lower = text.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index === -1) return text;
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);
  return (
    <span>
      {before}
      <span className="font-semibold text-foreground">{match}</span>
      {after}
    </span>
  );
}

export function BranchFormClient({ onSubmit, defaultValues, isSubmitting }: BranchFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [citySuggestions, setCitySuggestions] = useState<PlacesPrediction[]>([]);
  const [addressSuggestions, setAddressSuggestions] = useState<PlacesPrediction[]>([]);
  const [cityLocked, setCityLocked] = useState(false);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);

  const {
    manualMode,
    setManualMode,
    error: placesError,
    clearError,
    apiCallCount,
    getPredictions,
    getPlaceDetails,
    resetSessionToken,
  } = useGooglePlaces({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    country: "id",
  });

  const provinces = useMemo(() => regions.provinces.map((province) => province.name), []);

  const form = useForm<BranchFormValues>({
    defaultValues: {
      namaCabang: "",
      provinsi: "",
      kota: "",
      alamatLengkap: "",
      kecamatan: "",
      kelurahan: "",
      kodePos: "",
      nomorTelepon: "",
      googlePlaceId: null,
      latitude: null,
      longitude: null,
      inputMethod: "autocomplete",
      ...defaultValues,
    },
    onSubmit: async ({ value }) => {
      const parsed = branchSchema.safeParse(value);
      if (!parsed.success) {
        setFormError(parsed.error.issues[0]?.message ?? "Form tidak valid.");
        return;
      }

      setFormError(null);
      const payload: BranchPayload = {
        nama_cabang: parsed.data.namaCabang.trim(),
        provinsi: parsed.data.provinsi,
        kota: parsed.data.kota,
        alamat_lengkap: parsed.data.alamatLengkap,
        kecamatan: parsed.data.kecamatan?.trim() || null,
        kelurahan: parsed.data.kelurahan?.trim() || null,
        kode_pos: parsed.data.kodePos?.trim() || null,
        nomor_telepon: parsed.data.nomorTelepon.trim(),
        metadata: {
          google_place_id: parsed.data.googlePlaceId || null,
          koordinat:
            parsed.data.latitude !== null && parsed.data.longitude !== null
              ? { lat: parsed.data.latitude, lng: parsed.data.longitude }
              : null,
          input_method: parsed.data.inputMethod,
        },
      };

      await onSubmit?.(payload);
    },
  });

  const selectedProvince = form.state.values.provinsi;
  const selectedCity = form.state.values.kota;

  const manualProvince = useMemo(
    () => regions.provinces.find((province) => province.name === selectedProvince),
    [selectedProvince]
  );

  const manualCities = manualProvince?.cities ?? [];
  const manualCity = manualCities.find((city) => city.name === selectedCity);
  const manualDistricts = manualCity?.districts ?? [];
  const manualDistrict = manualDistricts.find((district) => district.name === form.state.values.kecamatan);
  const manualVillages = manualDistrict?.villages ?? [];

  useEffect(() => {
    form.setFieldValue("inputMethod", manualMode ? "manual" : "autocomplete");
    if (manualMode) {
      form.setFieldValue("googlePlaceId", null);
      form.setFieldValue("latitude", null);
      form.setFieldValue("longitude", null);
      resetSessionToken();
    }
  }, [form, manualMode, resetSessionToken]);

  const debouncedCityQuery = useDebouncedValue(cityQuery, 500);
  const debouncedAddressQuery = useDebouncedValue(addressQuery, 500);

  useEffect(() => {
    if (manualMode) return;
    if (!selectedProvince) {
      setCitySuggestions([]);
      return;
    }
    if (debouncedCityQuery.trim().length < 4) {
      setCitySuggestions([]);
      return;
    }

    let active = true;
    setLoadingCity(true);

    getPredictions({
      input: debouncedCityQuery,
      types: ["(cities)"],
      locationBias: getProvinceCenter(selectedProvince),
    }).then((results) => {
      if (!active) return;
      setCitySuggestions(results.slice(0, 5));
      setLoadingCity(false);
    });

    return () => {
      active = false;
    };
  }, [debouncedCityQuery, getPredictions, manualMode, selectedProvince]);

  useEffect(() => {
    if (manualMode) return;
    if (!selectedProvince || !selectedCity) {
      setAddressSuggestions([]);
      return;
    }
    if (debouncedAddressQuery.trim().length < 8) {
      setAddressSuggestions([]);
      return;
    }

    let active = true;
    setLoadingAddress(true);

    getPredictions({
      input: debouncedAddressQuery,
      types: ["address"],
      locationBias: getProvinceCenter(selectedProvince),
    }).then((results) => {
      if (!active) return;
      setAddressSuggestions(results.slice(0, 5));
      setLoadingAddress(false);
    });

    return () => {
      active = false;
    };
  }, [debouncedAddressQuery, getPredictions, manualMode, selectedCity, selectedProvince]);

  useEffect(() => {
    if (placesError) {
      setManualMode(true);
    }
  }, [placesError, setManualMode]);

  const handleSelectCity = (prediction: PlacesPrediction) => {
    form.setFieldValue("kota", prediction.structured_formatting?.main_text || prediction.description);
    setCityQuery(prediction.description);
    setCityLocked(true);
    setCitySuggestions([]);
    setAddressQuery("");
    form.setFieldValue("alamatLengkap", "");
    form.setFieldValue("kecamatan", "");
    form.setFieldValue("kelurahan", "");
    form.setFieldValue("kodePos", "");
    resetSessionToken();
  };

  const handleSelectAddress = async (prediction: PlacesPrediction) => {
    setAddressSuggestions([]);
    const details = await getPlaceDetails(prediction.place_id);
    if (!details) return;
    const parsed = parseAddressComponents(details.address_components, details.formatted_address);

    form.setFieldValue("alamatLengkap", parsed.alamatLengkap);
    form.setFieldValue("kota", parsed.kota || form.state.values.kota);
    form.setFieldValue("kecamatan", parsed.kecamatan || "");
    form.setFieldValue("kelurahan", parsed.kelurahan || "");
    form.setFieldValue("kodePos", parsed.kodePos || "");
    form.setFieldValue("googlePlaceId", details.place_id);

    const location = details.geometry?.location;
    if (location) {
      const lat = location.lat();
      const lng = location.lng();
      form.setFieldValue("latitude", lat);
      form.setFieldValue("longitude", lng);
    }

    resetSessionToken();
  };

  const resetCity = () => {
    setCityLocked(false);
    setCityQuery("");
    form.setFieldValue("kota", "");
    form.setFieldValue("alamatLengkap", "");
    setAddressQuery("");
    form.setFieldValue("kecamatan", "");
    form.setFieldValue("kelurahan", "");
    form.setFieldValue("kodePos", "");
    form.setFieldValue("googlePlaceId", null);
    form.setFieldValue("latitude", null);
    form.setFieldValue("longitude", null);
  };

  const resetAddress = () => {
    setAddressQuery("");
    form.setFieldValue("alamatLengkap", "");
    form.setFieldValue("kecamatan", "");
    form.setFieldValue("kelurahan", "");
    form.setFieldValue("kodePos", "");
    form.setFieldValue("googlePlaceId", null);
    form.setFieldValue("latitude", null);
    form.setFieldValue("longitude", null);
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Mode Input</p>
          <Badge variant={manualMode ? "warning" : "success"}>
            {manualMode ? "Mode Manual" : "Mode Otomatis"}
          </Badge>
          <span className="text-xs text-muted-foreground">API calls: {apiCallCount}/50</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={manualMode ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => {
              clearError();
              setManualMode(true);
            }}
          >
            Manual
          </Button>
          <Button
            type="button"
            variant={!manualMode ? "default" : "outline"}
            size="sm"
            className="h-8"
            onClick={() => {
              clearError();
              setManualMode(false);
            }}
          >
            Otomatis
          </Button>
        </div>
      </div>

      {placesError ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {placesError}
        </div>
      ) : null}

      <form.Field name="namaCabang">
        {(field) => (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Nama Cabang</p>
            <Input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Nama cabang"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="provinsi">
        {(field) => (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Provinsi</p>
            <Select
              value={field.state.value}
              onValueChange={(value) => {
                field.handleChange(value);
                resetCity();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih provinsi" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>

      {manualMode ? (
        <>
          <form.Field name="kota">
            {(field) => (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Kota / Area</p>
                {manualCities.length > 0 ? (
                  <Select value={field.state.value} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {manualCities.map((city) => (
                        <SelectItem key={city.name} value={city.name}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Ketik kota"
                  />
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="alamatLengkap">
            {(field) => (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Alamat Lengkap</p>
                <textarea
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Alamat lengkap"
                  className={cn(
                    "min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground",
                    "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/20"
                  )}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="kecamatan">
            {(field) => (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Kecamatan</p>
                {manualDistricts.length > 0 ? (
                  <Select value={field.state.value ?? ""} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kecamatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {manualDistricts.map((district) => (
                        <SelectItem key={district.name} value={district.name}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Kecamatan"
                  />
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="kelurahan">
            {(field) => (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Kelurahan</p>
                {manualVillages.length > 0 ? (
                  <Select value={field.state.value ?? ""} onValueChange={field.handleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kelurahan" />
                    </SelectTrigger>
                    <SelectContent>
                      {manualVillages.map((village) => (
                        <SelectItem key={village} value={village}>
                          {village}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Kelurahan"
                  />
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="kodePos">
            {(field) => (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Kode Pos</p>
                <Input
                  value={field.state.value ?? ""}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Kode pos"
                />
              </div>
            )}
          </form.Field>
        </>
      ) : (
        <>
          <form.Field name="kota">
            {(field) => (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Kota / Area</p>
                  {cityLocked ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={resetCity}>
                      Ubah kota
                    </Button>
                  ) : null}
                </div>
                <div className="relative">
                  <Input
                    value={cityLocked ? field.state.value : cityQuery}
                    onChange={(event) => {
                      setCityQuery(event.target.value);
                      if (!cityLocked) field.handleChange(event.target.value);
                    }}
                    placeholder="Ketik kota (min 4 karakter)"
                    disabled={cityLocked}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                    {loadingCity ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent" />
                    ) : null}
                    {cityQuery && !cityLocked ? (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setCityQuery("");
                          field.handleChange("");
                          setCitySuggestions([]);
                        }}
                        aria-label="Clear city"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                {citySuggestions.length > 0 ? (
                  <div className="mt-2 rounded-md border border-border bg-background shadow-sm">
                    {citySuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40"
                        onClick={() => handleSelectCity(suggestion)}
                      >
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <span>{highlightMatch(suggestion.description, debouncedCityQuery)}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="alamatLengkap">
            {(field) => (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Alamat Lengkap</p>
                <div className="relative">
                  <Input
                    value={addressQuery || field.state.value}
                    onChange={(event) => {
                      setAddressQuery(event.target.value);
                      field.handleChange(event.target.value);
                    }}
                    placeholder="Ketik alamat (min 8 karakter)"
                    disabled={!selectedCity}
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center gap-2">
                    {loadingAddress ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-transparent" />
                    ) : null}
                    {addressQuery ? (
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={resetAddress}
                        aria-label="Clear address"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
                {addressSuggestions.length > 0 ? (
                  <div className="mt-2 rounded-md border border-border bg-background shadow-sm">
                    {addressSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40"
                        onClick={() => handleSelectAddress(suggestion)}
                      >
                        <Search className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{highlightMatch(suggestion.description, debouncedAddressQuery)}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <form.Field name="kecamatan">
              {(field) => (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Kecamatan</p>
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Kecamatan"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="kelurahan">
              {(field) => (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Kelurahan</p>
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Kelurahan"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="kodePos">
              {(field) => (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Kode Pos</p>
                  <Input
                    value={field.state.value ?? ""}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Kode pos"
                  />
                </div>
              )}
            </form.Field>
          </div>
        </>
      )}

      <form.Field name="nomorTelepon">
        {(field) => (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Nomor Telepon</p>
            <Input
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Nomor telepon"
            />
          </div>
        )}
      </form.Field>

      {formError ? <p className="text-xs text-rose-600 font-semibold">{formError}</p> : null}

      <Button className="h-9 text-xs font-semibold" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Menyimpan..." : "Simpan Cabang"}
      </Button>
    </form>
  );
}
