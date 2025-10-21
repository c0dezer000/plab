"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Sprout, Droplets, Plus, Eye } from "lucide-react"

interface SiteWithProjects {
  id: string
  siteName: string
  siteType?: string | null
  regionCode?: string | null
  provinceCode?: string | null
  cityMunicipalityCode?: string | null
  barangayCode?: string | null
  binhiProjects?: any[]
  lawaProjects?: any[]
}

export function ProjectsBySiteCombined() {
  const [sites, setSites] = useState<SiteWithProjects[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setSites(data))
      .catch(async (err) => {
        const msg = typeof err?.text === "function" ? await err.text() : "Failed to load sites"
        setError(msg)
        setSites([])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground">Loading sites…</div>
  if (error) return <div className="text-sm text-destructive">{error}</div>
  if (!sites?.length) return <div className="text-sm text-muted-foreground">No sites yet</div>

  return (
    <div className="space-y-6">
      {sites.map((site) => {
        const lawa = site.lawaProjects ?? []
        const binhi = site.binhiProjects ?? []
        const total = lawa.length + binhi.length
        return (
          <Card key={site.id} className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    {site.siteName}
                    {site.siteType && (
                      <Badge variant="outline" className="ml-1 capitalize">
                        {site.siteType.toLowerCase()}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {site.regionCode || "--"} / {site.provinceCode || "--"} / {site.cityMunicipalityCode || "--"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" /> New Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Droplets className="h-3 w-3 text-chart-1" /> Lawa: {lawa.length}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sprout className="h-3 w-3 text-chart-2" /> Binhi: {binhi.length}
                </Badge>
                <Badge variant="outline">Total: {total}</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {lawa.map((p) => (
                  <div key={p.id} className="rounded border bg-muted/30 p-3 text-xs flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="font-medium flex items-center gap-1 text-chart-1">
                        <Droplets className="h-3 w-3" /> {p.id}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-3 w-3" /></Button>
                    </div>
                    <div className="text-muted-foreground">Type: {p.typeOfLawa || "—"}</div>
                    <div className="text-muted-foreground">Target: {p.physicalTarget ?? 0}</div>
                  </div>
                ))}
                {binhi.map((p) => (
                  <div key={p.id} className="rounded border bg-muted/30 p-3 text-xs flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="font-medium flex items-center gap-1 text-chart-2">
                        <Sprout className="h-3 w-3" /> {p.id}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6"><Eye className="h-3 w-3" /></Button>
                    </div>
                    <div className="text-muted-foreground">Beneficiaries: {p.actualBeneficiaries ?? 0}</div>
                    <div className="text-muted-foreground">Area: {p.areaUtilizedSqm ?? p.areaUtilized ?? 0}</div>
                  </div>
                ))}
                {total === 0 && <div className="text-xs text-muted-foreground">No projects yet.</div>}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
