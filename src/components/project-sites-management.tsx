"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Plus, Search, Edit, Eye, Calendar } from "lucide-react"

export interface ProjectSitesManagementSite {
  id: string
  siteName: string
  province: string
  cityMunicipality: string
  barangay: string
  dateEstablished: string | null
  lawaProjects: number
  binhiProjects: number
  totalBeneficiaries: number
  status: "Active" | "Planning" | "Completed"
  remarks?: string | null
}

interface ProjectSitesManagementProps {
  sites: ProjectSitesManagementSite[]
}

export function ProjectSitesManagement({ sites }: ProjectSitesManagementProps) {
  const [siteState, setSiteState] = useState<ProjectSitesManagementSite[]>(sites)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<ProjectSitesManagementSite | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    setSiteState(sites)
  }, [sites])

  const filteredSites = useMemo(
    () =>
      siteState.filter(
        (site) =>
          site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.cityMunicipality.toLowerCase().includes(searchTerm.toLowerCase()) ||
          site.barangay.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [siteState, searchTerm],
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-primary text-primary-foreground"
      case "Planning":
        return "bg-accent text-accent-foreground"
      case "Completed":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const handleViewSite = (site: ProjectSitesManagementSite) => {
    setSelectedSite(site)
    setIsViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Sites</h2>
          <p className="text-muted-foreground">Manage and monitor all project locations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Site
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Project Site</DialogTitle>
              <DialogDescription>Create a new project site to start tracking Lawa and Binhi projects</DialogDescription>
            </DialogHeader>
            <AddSiteForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by site name, province, city, or barangay..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sites Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteState.length}</div>
            <p className="text-xs text-muted-foreground">Across multiple provinces</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{siteState.filter((site) => site.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">Currently operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beneficiaries</CardTitle>
            <MapPin className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {siteState.reduce((total, site) => total + site.totalBeneficiaries, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all sites</p>
          </CardContent>
        </Card>
      </div>

      {/* Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Sites Directory</CardTitle>
          <CardDescription>
            Complete list of all project sites with their current status and project counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site Information</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Beneficiaries</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Established</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{site.siteName}</div>
                      <div className="text-sm text-muted-foreground">ID: {site.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{site.province}</div>
                      <div className="text-muted-foreground">
                        {site.cityMunicipality}, {site.barangay}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm">
                        <span className="text-chart-1">Lawa: {site.lawaProjects}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-chart-2">Binhi: {site.binhiProjects}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{site.totalBeneficiaries}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(site.status)}>{site.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {site.dateEstablished ? new Date(site.dateEstablished).toLocaleDateString() : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewSite(site)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Site Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Site Details</DialogTitle>
            <DialogDescription>Complete information for {selectedSite?.siteName}</DialogDescription>
          </DialogHeader>
          {selectedSite && <SiteDetailsView site={selectedSite} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddSiteForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input id="siteName" placeholder="Enter site name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Province</Label>
          <Input id="province" placeholder="Enter province" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City/Municipality</Label>
          <Input id="city" placeholder="Enter city or municipality" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barangay">Barangay</Label>
          <Input id="barangay" placeholder="Enter barangay" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateEstablished">Date Established</Label>
        <Input id="dateEstablished" type="date" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" placeholder="Additional notes about this site..." />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Create Site</Button>
      </div>
    </form>
  )
}

function SiteDetailsView({ site }: { site: ProjectSitesManagementSite }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Site ID</Label>
          <p className="text-sm">{site.id}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <Badge
            className={`${site.status === "Active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} mt-1`}
          >
            {site.status}
          </Badge>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Location</Label>
        <p className="text-sm">
          {site.barangay}, {site.cityMunicipality}, {site.province}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Lawa Projects</Label>
          <p className="text-2xl font-bold text-chart-1">{site.lawaProjects}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Binhi Projects</Label>
          <p className="text-2xl font-bold text-chart-2">{site.binhiProjects}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Total Beneficiaries</Label>
          <p className="text-2xl font-bold text-accent">{site.totalBeneficiaries}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Date Established</Label>
          <p className="text-sm">
            {site.dateEstablished ? new Date(site.dateEstablished).toLocaleDateString() : "—"}
          </p>
      </div>

      {site.remarks && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Remarks</Label>
          <p className="text-sm">{site.remarks}</p>
        </div>
      )}
    </div>
  )
}
