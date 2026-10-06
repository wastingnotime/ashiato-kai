export type Immigrant = {
  immigrantID: number;
  groupID: number;
  NameRomaji: string;
  SurnameRomaji: string;
  NameKanji: string;
  SurnameKanji: string;
  Year: number;
  PrefectureName: string;
  ShipName: string;
  DepartureDate: string;
  ArrivalDate: string;
  Destination: string;
  Farm: string;
};

export type Group = Pick<
  Immigrant,
  | "groupID"
  | "Year"
  | "PrefectureName"
  | "ShipName"
  | "DepartureDate"
  | "ArrivalDate"
  | "Destination"
  | "Farm"
> & {
  immigrants: Pick<
    Immigrant,
    | "immigrantID"
    | "NameRomaji"
    | "SurnameRomaji"
    | "NameKanji"
    | "SurnameKanji"
  >[];
};

export type NameStat = {
  Rank: number;
  NameRomaji: string;
  NameKanji: string;
  Count: number;
};
export type SurnameStat = {
  Rank: number;
  SurnameRomaji: string;
  SurnameKanji: string;
  Count: number;
};
export type PrefectureStat = {
  Rank: number;
  PrefectureName: string;
  Count: number;
};

export type GeoFeature = {
  type: "Feature";
  properties: Record<string, string>;
  geometry: { type: "Point" | "Polygon" | "MultiPolygon"; coordinates: any };
};
export type Geolocation = {
  type: "FeatureCollection";
  bbox: number[];
  displayBbox?: number[];
  features: GeoFeature[];
};

export const searchKeys = [
  "NameRomaji",
  "SurnameRomaji",
  "Year",
  "PrefectureName",
  "ShipName",
] as const;
export type SearchKey = (typeof searchKeys)[number];

export class ApiError extends Error {
  constructor(public code: "validationError" | "loadError") {
    super(code);
  }
}

async function getJson<T>(path: string, params?: URLSearchParams): Promise<T> {
  const suffix = params?.toString();
  const response = await fetch(`/web-api${path}${suffix ? `?${suffix}` : ""}`);
  if (!response.ok) {
    if (response.status === 400) throw new ApiError("validationError");
    throw new ApiError("loadError");
  }
  return response.json() as Promise<T>;
}

export function searchImmigrants(params: URLSearchParams) {
  const filtered = new URLSearchParams();
  for (const key of searchKeys) {
    const value = params.get(key)?.trim();
    if (value) filtered.set(key, value);
  }
  return getJson<Immigrant[]>("/api/v1/immigrants", filtered);
}

export const getGroup = (id: number) => getJson<Group>(`/api/v1/groups/${id}`);
export const topNames = () =>
  getJson<NameStat[]>("/api/v1/statistics/names/top");
export const topSurnames = () =>
  getJson<SurnameStat[]>("/api/v1/statistics/surnames/top");
export const topPrefectures = () =>
  getJson<PrefectureStat[]>("/api/v1/statistics/prefectures/top");
export const nameStats = (name: string) =>
  getJson<NameStat[]>(
    "/api/v1/statistics/names",
    new URLSearchParams({ NameRomaji: name }),
  );
export const surnameStats = (name: string) =>
  getJson<SurnameStat[]>(
    "/api/v1/statistics/surnames",
    new URLSearchParams({ SurnameRomaji: name }),
  );
export const prefectureStats = (name: string) =>
  getJson<PrefectureStat[]>(
    "/api/v1/statistics/prefectures",
    new URLSearchParams({ PrefectureName: name }),
  );
export const prefectureGeo = (name: string) =>
  getJson<Geolocation>(`/api/v1/geolocation/${encodeURIComponent(name)}`);
