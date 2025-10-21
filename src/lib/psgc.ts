import path from "path"
import { promises as fs } from "fs"

interface RegionRecord {
  psgc_id: string
  name: string
  correspondence_code?: string | null
  geographic_level?: string | null
}

interface ProvinceRecord extends RegionRecord {}
interface MunicipalityRecord extends RegionRecord {}
interface BarangayRecord extends RegionRecord {}

export interface PSGCOption {
  code: string
  psgcId: string
  name: string
  parentCode?: string | null
}

type RegionOption = PSGCOption

type ProvinceOption = PSGCOption

type MunicipalityOption = PSGCOption

type BarangayOption = PSGCOption

const PSGC_BASE_PATH = path.join(process.cwd(), "data", "psgc")

let regionsCache: RegionRecord[] | null = null
let provincesCache: ProvinceRecord[] | null = null
let municipalitiesCache: MunicipalityRecord[] | null = null
let barangaysCache: BarangayRecord[] | null = null

let provinceOptionsCache: ProvinceOption[] | null = null
let municipalityOptionsCache: MunicipalityOption[] | null = null
let barangayOptionsCache: BarangayOption[] | null = null

const provinceIndexByRegion = new Map<string, ProvinceOption[]>()
const municipalityIndexByProvince = new Map<string, MunicipalityOption[]>()
const municipalityIndexByRegion = new Map<string, MunicipalityOption[]>()
const barangayIndexByMunicipality = new Map<string, BarangayOption[]>()

async function loadJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(PSGC_BASE_PATH, filename)
  const data = await fs.readFile(filePath, "utf-8")
  return JSON.parse(data) as T
}

function normalizeName(name: string | undefined | null): string {
  if (!name) return ""
  return name.replace(/\s+/g, " ").trim()
}

function regionCodeFromPsgc(psgcId: string): string {
  return psgcId.slice(0, 2)
}

function provinceCodeFromPsgc(psgcId: string): string {
  return psgcId.slice(0, 4)
}

function municipalityCodeFromPsgc(psgcId: string): string {
  return psgcId.slice(0, 6)
}

function barangayCodeFromPsgc(psgcId: string): string {
  return psgcId.slice(0, 9)
}

export async function listRegions(): Promise<RegionOption[]> {
  if (!regionsCache) {
    regionsCache = await loadJsonFile<RegionRecord[]>("region.json")
  }

  const seen = new Set<string>()
  const regions = regionsCache
    .filter((region) => region.geographic_level === "Reg")
    .map((region) => {
      const name = normalizeName(region.name)
      const psgcId = region.psgc_id
      const code = regionCodeFromPsgc(psgcId)
      return { code, psgcId, name }
    })
    .filter((region) => {
      if (!region.code || seen.has(region.code)) return false
      seen.add(region.code)
      return true
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  return regions
}

function ensureProvinceOptions() {
  if (provinceOptionsCache) return
  if (!provincesCache) {
    throw new Error("Provinces cache not initialised")
  }

  const seen = new Set<string>()
  const options: ProvinceOption[] = []

  for (const province of provincesCache) {
    if (province.geographic_level !== "Prov") continue
    const name = normalizeName(province.name)
    const psgcId = province.psgc_id
    const code = provinceCodeFromPsgc(psgcId)
    if (!code || seen.has(code)) continue
    seen.add(code)
    const parentCode = regionCodeFromPsgc(psgcId)
    const option: ProvinceOption = { code, psgcId, name, parentCode }
    options.push(option)
    if (!provinceIndexByRegion.has(parentCode)) {
      provinceIndexByRegion.set(parentCode, [])
    }
    provinceIndexByRegion.get(parentCode)!.push(option)
  }

  options.sort((a, b) => a.name.localeCompare(b.name))
  for (const list of provinceIndexByRegion.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  provinceOptionsCache = options
}

export async function listProvinces(regionCode?: string): Promise<ProvinceOption[]> {
  if (!provincesCache) {
    provincesCache = await loadJsonFile<ProvinceRecord[]>("province.json")
  }

  ensureProvinceOptions()

  if (!regionCode) {
    return [...(provinceOptionsCache ?? [])]
  }

  const matches = provinceIndexByRegion.get(regionCode)
  return matches ? [...matches] : []
}

function ensureMunicipalityOptions() {
  if (municipalityOptionsCache) return
  if (!municipalitiesCache) {
    throw new Error("Municipalities cache not initialised")
  }

  const seen = new Set<string>()
  const options: MunicipalityOption[] = []

  for (const municipality of municipalitiesCache) {
    const level = municipality.geographic_level ?? ""
    if (level !== "Mun" && level !== "City") continue
    const name = normalizeName(municipality.name)
    const psgcId = municipality.psgc_id
    const code = municipalityCodeFromPsgc(psgcId)
    if (!code || seen.has(code)) continue
    seen.add(code)
    const parentCode = provinceCodeFromPsgc(psgcId)
    const regionCode = regionCodeFromPsgc(psgcId)
    const option: MunicipalityOption = { code, psgcId, name, parentCode }
    options.push(option)
    if (!municipalityIndexByProvince.has(parentCode)) {
      municipalityIndexByProvince.set(parentCode, [])
    }
    municipalityIndexByProvince.get(parentCode)!.push(option)
    if (!municipalityIndexByRegion.has(regionCode)) {
      municipalityIndexByRegion.set(regionCode, [])
    }
    municipalityIndexByRegion.get(regionCode)!.push(option)
  }

  options.sort((a, b) => a.name.localeCompare(b.name))
  for (const list of municipalityIndexByProvince.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  municipalityOptionsCache = options
}

export async function listMunicipalities(provinceCode?: string, regionCode?: string): Promise<MunicipalityOption[]> {
  if (!municipalitiesCache) {
    municipalitiesCache = await loadJsonFile<MunicipalityRecord[]>("municipal-city.json")
  }

  ensureMunicipalityOptions()

  if (provinceCode) {
    const matches = municipalityIndexByProvince.get(provinceCode)
    return matches ? [...matches] : []
  }

  if (regionCode) {
    const matches = municipalityIndexByRegion.get(regionCode)
    return matches ? [...matches] : []
  }

  return [...(municipalityOptionsCache ?? [])]
}

function ensureBarangayOptions() {
  if (barangayOptionsCache) return
  if (!barangaysCache) {
    throw new Error("Barangays cache not initialised")
  }

  const options: BarangayOption[] = []
  const globalSeen = new Set<string>()
  const municipalitySeen = new Map<string, Set<string>>()

  for (const barangay of barangaysCache) {
    if (barangay.geographic_level !== "Bgy") continue
    const name = normalizeName(barangay.name)
    const psgcId = barangay.psgc_id
    const code = barangayCodeFromPsgc(psgcId)
    if (!code) continue
    const parentCode = municipalityCodeFromPsgc(psgcId)
    const dedupeKey = `${parentCode}:${code}`
    if (globalSeen.has(dedupeKey)) continue
    globalSeen.add(dedupeKey)
    const option: BarangayOption = { code, psgcId, name, parentCode }
    options.push(option)
    if (!barangayIndexByMunicipality.has(parentCode)) {
      barangayIndexByMunicipality.set(parentCode, [])
      municipalitySeen.set(parentCode, new Set())
    }
    const seenForMunicipality = municipalitySeen.get(parentCode)!
    if (seenForMunicipality.has(code)) continue
    seenForMunicipality.add(code)
    barangayIndexByMunicipality.get(parentCode)!.push(option)
  }

  for (const list of barangayIndexByMunicipality.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  barangayOptionsCache = options
}

export async function listBarangays(municipalityCode: string): Promise<BarangayOption[]> {
  if (!barangaysCache) {
    barangaysCache = await loadJsonFile<BarangayRecord[]>("psgc_barangays_1q23.json")
  }

  ensureBarangayOptions()

  if (!municipalityCode) {
    return []
  }

  const matches = barangayIndexByMunicipality.get(municipalityCode)
  return matches ? [...matches] : []
}
