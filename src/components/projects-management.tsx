"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Droplets, Sprout, Plus, Search, Edit, Eye, Target, TrendingUp, MapPin } from "lucide-react"
// Optional: import combined site view (currently separate component)
// import { ProjectsBySiteCombined } from "@/components/projects-by-site-combined"

export type ProjectsManagementStatus = "Planning" | "In Progress" | "Completed" | "On Hold"

export interface ProjectsManagementProjectSite {
  id: string
  siteName: string
}

export interface ProjectsManagementLawaProject {
  id: string
  projectSiteId: string
  siteName: string
  physicalTarget: number
  actualTarget: number
  typeOfLawa: string
  length: number
  width: number
  depth: number
  capacityWaterVolume: number
  noOfLawa: number
  noProducedAquaticResources: number
  noFacilitiesEstablished: number
  noFacilitiesRepaired: number
  areaUtilized: number
  projectedHarvest: number
  actualHarvest: number
  status: ProjectsManagementStatus
  remarks?: string | null
}

export interface ProjectsManagementBinhiProject {
  id: string
  projectSiteId: string
  siteName: string
  actualBeneficiaries: number
  linkedBeneficiaries?: number
  areaUtilized: number
  totalNoBinhiPlanted: number
  totalNoBinhiHarvested: number
  noBinhiSitesEstablished: number
  expectedYieldPerSqm: number
  projectedHarvest: number
  actualHarvest: number
  status: ProjectsManagementStatus
  remarks?: string | null
}

interface ProjectSiteGroup {
  projectSiteId: string
  siteName: string
  lawaProjects: ProjectsManagementLawaProject[]
  binhiProjects: ProjectsManagementBinhiProject[]
}

type ProjectParticipantRecord = {
  id: string
  name: string | null
  age: number | null
  sex: string | null
  participationStatus: string | null
  dateLinked: string | null
}

type SiteBeneficiaryCandidate = {
  id: string
  name: string | null
  age: number | null
  sex: string | null
  enrollmentStatus: string | null
  dateEnrolled: string | null
  linkedToTarget: boolean
}

interface ProjectsManagementProps {
  lawaProjects: ProjectsManagementLawaProject[]
  binhiProjects: ProjectsManagementBinhiProject[]
  projectSites?: ProjectsManagementProjectSite[]
}

export function ProjectsManagement({ lawaProjects, binhiProjects, projectSites = [] }: ProjectsManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("unified")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<
    ProjectsManagementLawaProject | ProjectsManagementBinhiProject | null
  >(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [lawaState, setLawaState] = useState(lawaProjects)
  const [binhiState, setBinhiState] = useState(binhiProjects)
  const { toast } = useToast()

  useEffect(() => {
    setLawaState(lawaProjects)
  }, [lawaProjects])

  useEffect(() => {
    setBinhiState(binhiProjects)
  }, [binhiProjects])

  // Listen for project-linked events (dispatched after assignments) and update
  // local project lists so progress bars reflect newly linked beneficiary counts.
  useEffect(() => {
    const handler = (event: Event) => {
      try {
        const detail = (event as CustomEvent)?.detail as { projectId?: string; projectType?: string; linkedCount?: number }
        if (!detail || !detail.projectId) return
        const { projectId, projectType, linkedCount } = detail
        if (typeof linkedCount !== 'number') return

        if (projectType === 'LAWA') {
          setLawaState((prev) => prev.map((p) => (p.id === projectId ? { ...p, actualTarget: linkedCount } : p)))
        } else if (projectType === 'BINHI') {
          setBinhiState((prev) => prev.map((p) => (p.id === projectId ? { ...p, actualBeneficiaries: linkedCount } : p)))
        }
      } catch (e) {
        console.error('projectLinked handler error', e)
      }
    }

    window.addEventListener('projectLinked', handler as EventListener)
    return () => window.removeEventListener('projectLinked', handler as EventListener)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-primary text-primary-foreground"
      case "In Progress":
        return "bg-accent text-accent-foreground"
      case "Planning":
        return "bg-secondary text-secondary-foreground"
      case "On Hold":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getProgressPercentage = (
    project: ProjectsManagementLawaProject | ProjectsManagementBinhiProject,
  ) => {
    if ("actualTarget" in project) {
      return Math.round((project.actualTarget / project.physicalTarget) * 100)
    } else {
  // Prefer using linkedBeneficiaries (derived from beneficiary links) as the numerator when available.
  // Fall back to actualBeneficiaries (stored field) if linked is not present.
  const beneficiaries = (project as ProjectsManagementBinhiProject).linkedBeneficiaries ?? (project as ProjectsManagementBinhiProject).actualBeneficiaries
      const planted = (project as ProjectsManagementBinhiProject).totalNoBinhiPlanted
      // If the Binhi project has a physical target in the form of actualBeneficiaries (preferred),
      // compute percent = beneficiaries / physicalTarget. Otherwise fallback to planted/harvested ratio.
      if (typeof beneficiaries === "number" && typeof planted === "number") {
        // If beneficiaries map to an implicit target (physicalTarget), assume planted is the denominator for planting progress.
        // Use beneficiaries / max(planted, 1) to avoid division by zero.
        return Math.round((beneficiaries / Math.max(planted, 1)) * 100)
      }
      if (typeof planted === "number" && planted > 0) {
        return Math.round(((project as ProjectsManagementBinhiProject).totalNoBinhiHarvested / planted) * 100)
      }
      return 0
    }
  }

  const getProjectSiteGroups = useMemo(() => {
    const siteMap = new Map<string, ProjectSiteGroup>()

    lawaState.forEach((project) => {
      if (!siteMap.has(project.projectSiteId)) {
        siteMap.set(project.projectSiteId, {
          projectSiteId: project.projectSiteId,
          siteName: project.siteName,
          lawaProjects: [],
          binhiProjects: [],
        })
      }
      siteMap.get(project.projectSiteId)!.lawaProjects.push(project)
    })

    binhiState.forEach((project) => {
      if (!siteMap.has(project.projectSiteId)) {
        siteMap.set(project.projectSiteId, {
          projectSiteId: project.projectSiteId,
          siteName: project.siteName,
          lawaProjects: [],
          binhiProjects: [],
        })
      }
      siteMap.get(project.projectSiteId)!.binhiProjects.push(project)
    })

    return Array.from(siteMap.values()).sort((a, b) => a.projectSiteId.localeCompare(b.projectSiteId))
  }, [lawaState, binhiState])

  const filteredProjectSiteGroups = useMemo(() => {
    return getProjectSiteGroups
      .map((group) => ({
        ...group,
        lawaProjects: group.lawaProjects.filter((project) => {
          const matchesSearch =
            project.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.typeOfLawa.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesStatus =
            statusFilter === "all" || project.status.toLowerCase().replace(" ", "").includes(statusFilter)
          return matchesSearch && matchesStatus
        }),
        binhiProjects: group.binhiProjects.filter((project) => {
          const matchesSearch =
            project.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.id.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesStatus =
            statusFilter === "all" || project.status.toLowerCase().replace(" ", "").includes(statusFilter)
          return matchesSearch && matchesStatus
        }),
      }))
      .filter((group) => group.lawaProjects.length > 0 || group.binhiProjects.length > 0)
  }, [getProjectSiteGroups, searchTerm, statusFilter])

  const handleViewProject = (
    project: ProjectsManagementLawaProject | ProjectsManagementBinhiProject,
  ) => {
    setSelectedProject(project)
    setIsViewDialogOpen(true)
  }

  const handleEditProject = (project: ProjectsManagementLawaProject | ProjectsManagementBinhiProject) => {
    setSelectedProject(project)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSite = async (siteId: string) => {
    if (!siteId) return
    if (!confirm(`Delete site ${siteId} and all related data? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/sites/${encodeURIComponent(siteId)}`, { method: 'DELETE' })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || 'Failed')
      setLawaState(prev => prev.filter(p => p.projectSiteId !== siteId))
      setBinhiState(prev => prev.filter(p => p.projectSiteId !== siteId))
      // notify
  try { toast({ title: 'Site deleted', description: `${siteId} removed.` }) } catch (_) { /* toast failed */ }
    } catch (e: any) {
      console.error(e)
      try { toast({ title: 'Delete failed', description: e?.message || String(e), variant: 'destructive' }) } catch (_) { /* toast failed */ }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects Management</h2>
          <p className="text-muted-foreground">Manage Lawa and Binhi projects across all sites</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent size="xl" className="max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>Create a new Lawa or Binhi project</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <AddProjectForm
                onClose={() => setIsAddDialogOpen(false)}
                projectSites={projectSites}
                onAddLawa={(p) => setLawaState(prev => [p, ...prev])}
                onAddBinhi={(p) => setBinhiState(prev => [p, ...prev])}
              />
            </DialogBody>
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
                placeholder="Search by project name, ID, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="inprogress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="onhold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lawa Projects</CardTitle>
            <Droplets className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{lawaProjects.length}</div>
            <p className="text-xs text-muted-foreground">Water-related projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Binhi Projects</CardTitle>
            <Sprout className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{binhiProjects.length}</div>
            <p className="text-xs text-muted-foreground">Agriculture projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...lawaState, ...binhiState].filter((p) => p.status === "In Progress").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...lawaState, ...binhiState].filter((p) => p.status === "Completed").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unified" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            By Project Site
          </TabsTrigger>
          <TabsTrigger value="lawa" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Lawa Projects
          </TabsTrigger>
          <TabsTrigger value="binhi" className="flex items-center gap-2">
            <Sprout className="h-4 w-4" />
            Binhi Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unified">
          <div className="space-y-6">
            {filteredProjectSiteGroups.map((siteGroup) => (
              <Card key={siteGroup.projectSiteId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {siteGroup.siteName}
                      </CardTitle>
                      <CardDescription>
                        Site ID: {siteGroup.projectSiteId} •
                        {siteGroup.lawaProjects.length > 0 &&
                          ` ${siteGroup.lawaProjects.length} Lawa project${siteGroup.lawaProjects.length !== 1 ? "s" : ""}`}
                        {siteGroup.lawaProjects.length > 0 && siteGroup.binhiProjects.length > 0 && " • "}
                        {siteGroup.binhiProjects.length > 0 &&
                          ` ${siteGroup.binhiProjects.length} Binhi project${siteGroup.binhiProjects.length !== 1 ? "s" : ""}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {siteGroup.lawaProjects.length > 0 && (
                        <Badge variant="outline" className="text-chart-1 border-chart-1">
                          <Droplets className="h-3 w-3 mr-1" />
                          Lawa
                        </Badge>
                      )}
                      {siteGroup.binhiProjects.length > 0 && (
                        <Badge variant="outline" className="text-chart-2 border-chart-2">
                          <Sprout className="h-3 w-3 mr-1" />
                          Binhi
                        </Badge>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSite(siteGroup.projectSiteId)}>
                        Delete Site
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Lawa Projects Section */}
                    {siteGroup.lawaProjects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-chart-1 mb-3 flex items-center gap-2">
                          <Droplets className="h-4 w-4" />
                          Lawa Projects ({siteGroup.lawaProjects.length})
                        </h4>
                        <div className="space-y-3">
                          {siteGroup.lawaProjects.map((project) => (
                            <div key={project.id} className="border rounded-lg p-4 bg-muted/30">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="font-medium text-sm">{project.id}</div>
                                  <div className="text-xs text-muted-foreground">{project.typeOfLawa}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {project.length}m × {project.width}m × {project.depth}m
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Progress</div>
                                  <Progress value={getProgressPercentage(project)} className="h-2 mb-1" />
                                  <div className="text-xs text-muted-foreground">
                                    {project.actualTarget}/{project.physicalTarget} linked beneficiaries
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Harvest</div>
                                  <div className="text-sm">Projected: {project.projectedHarvest}kg</div>
                                  <div className="text-xs text-muted-foreground">Actual: {project.actualHarvest}kg</div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewProject(project)}>
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Binhi Projects Section */}
                    {siteGroup.binhiProjects.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-chart-2 mb-3 flex items-center gap-2">
                          <Sprout className="h-4 w-4" />
                          Binhi Projects ({siteGroup.binhiProjects.length})
                        </h4>
                        <div className="space-y-3">
                          {siteGroup.binhiProjects.map((project) => (
                            <div key={project.id} className="border rounded-lg p-4 bg-muted/30">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="font-medium text-sm">{project.id}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {project.actualBeneficiaries} beneficiaries
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {project.areaUtilized} sqm utilized
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Progress toward targeted beneficiaries</div>
                                  <Progress value={getProgressPercentage(project)} className="h-2 mb-1" />
                                  <div className="text-xs text-muted-foreground">
                                    {project.totalNoBinhiHarvested}/{project.totalNoBinhiPlanted} • {project.actualBeneficiaries ?? 0} beneficiaries linked
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Harvest</div>
                                  <div className="text-sm">Projected: {project.projectedHarvest}kg</div>
                                  <div className="text-xs text-muted-foreground">Actual: {project.actualHarvest}kg</div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => handleViewProject(project)}>
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lawa">
          <Card>
            <CardHeader>
              <CardTitle>Lawa Projects Directory</CardTitle>
              <CardDescription>Water-related projects including fishponds and aquaculture facilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Info</TableHead>
                    <TableHead>Site Location</TableHead>
                    <TableHead>Type & Specifications</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Harvest Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lawaState.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.id}</div>
                          <div className="text-sm text-muted-foreground">{project.siteName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{project.projectSiteId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{project.typeOfLawa}</div>
                          <div className="text-muted-foreground">
                            {project.length}m × {project.width}m × {project.depth}m
                          </div>
                          <div className="text-muted-foreground">
                            {project.noOfLawa} unit{project.noOfLawa !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{getProgressPercentage(project)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(project)} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {project.actualTarget}/{project.physicalTarget} linked beneficiaries
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Projected: {project.projectedHarvest}kg</div>
                          <div className="text-muted-foreground">Actual: {project.actualHarvest}kg</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewProject(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
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
        </TabsContent>

        <TabsContent value="binhi">
          <Card>
            <CardHeader>
              <CardTitle>Binhi Projects Directory</CardTitle>
              <CardDescription>
                Agriculture and planting projects including vegetable gardens and crop production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Info</TableHead>
                    <TableHead>Site Location</TableHead>
                    <TableHead>Beneficiaries & Area</TableHead>
                    <TableHead>Planting Progress</TableHead>
                    <TableHead>Harvest Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {binhiState.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.id}</div>
                          <div className="text-sm text-muted-foreground">{project.siteName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{project.projectSiteId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{project.actualBeneficiaries} beneficiaries</div>
                          <div className="text-muted-foreground">{project.areaUtilized} sqm utilized</div>
                          <div className="text-muted-foreground">
                            {project.noBinhiSitesEstablished} sites established
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress toward targeted beneficiaries</span>
                            <span>{getProgressPercentage(project)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(project)} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {project.totalNoBinhiHarvested}/{project.totalNoBinhiPlanted} • {project.actualBeneficiaries ?? 0} beneficiaries
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Projected: {project.projectedHarvest}kg</div>
                          <div className="text-muted-foreground">Actual: {project.actualHarvest}kg</div>
                          <div className="text-muted-foreground">Yield: {project.expectedYieldPerSqm}kg/sqm</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewProject(project)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditProject(project)}>
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
        </TabsContent>
      </Tabs>

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent size="xl" className="max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>Complete information for {selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <DialogBody>
              <ProjectDetailsView project={selectedProject} />
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="xl" className="max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Edit and save changes to the project</DialogDescription>
          </DialogHeader>
          {selectedProject && (
            <DialogBody>
              <EditProjectForm project={selectedProject} onSaved={(updated) => {
                // update local state lists
                if ('typeOfLawa' in updated) {
                  setLawaState(prev => prev.map(p => p.id === updated.id ? ({ ...p, ...updated }) : p))
                } else {
                  setBinhiState(prev => prev.map(p => p.id === updated.id ? ({ ...p, ...updated }) : p))
                }
                setIsEditDialogOpen(false)
              }} onCancel={() => setIsEditDialogOpen(false)} />
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddProjectForm({
  onClose,
  projectSites = [],
  onAddLawa,
  onAddBinhi,
}: {
  onClose: () => void
  projectSites?: ProjectsManagementProjectSite[]
  onAddLawa?: (p: ProjectsManagementLawaProject) => void
  onAddBinhi?: (p: ProjectsManagementBinhiProject) => void
}) {
  const { toast } = useToast()
  // Step control
  const [step, setStep] = useState<1 | 2>(1)
  // Available sites (initial from props; can fetch if empty)
  const [sites, setSites] = useState<ProjectsManagementProjectSite[]>(projectSites)
  const [loadingSites, setLoadingSites] = useState(false)
  const [siteError, setSiteError] = useState<string | null>(null)
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(projectSites[0]?.id)
  // Create site inline
  const [showCreateSite, setShowCreateSite] = useState(false)
  const [newSiteName, setNewSiteName] = useState("")
  const [creatingSite, setCreatingSite] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  type PSGCOption = {
    code: string
    name: string
    psgcId: string
    parentCode?: string | null
  }

  const [regions, setRegions] = useState<PSGCOption[]>([])
  const [provinces, setProvinces] = useState<PSGCOption[]>([])
  const [municipalities, setMunicipalities] = useState<PSGCOption[]>([])
  const [barangays, setBarangays] = useState<PSGCOption[]>([])

  const [regionsLoading, setRegionsLoading] = useState(false)
  const [provincesLoading, setProvincesLoading] = useState(false)
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(false)
  const [barangaysLoading, setBarangaysLoading] = useState(false)

  const [selectedRegionCode, setSelectedRegionCode] = useState<string | undefined>()
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string | undefined>()
  const [selectedMunicipalityCode, setSelectedMunicipalityCode] = useState<string | undefined>()
  const [selectedBarangayCode, setSelectedBarangayCode] = useState<string | undefined>()

  // Step 2 state: which project types to create
  const [createLawa, setCreateLawa] = useState(true)
  const [createBinhi, setCreateBinhi] = useState(false)
  const [status, setStatus] = useState<string | undefined>()
  const [remarks, setRemarks] = useState("")

  // Lawa fields
  const [lawaFields, setLawaFields] = useState({
    typeOfLawa: "",
    noOfLawa: "",
    length: "",
    width: "",
    depth: "",
    partnerBeneficiaries: "",
    projectedHarvest: "",
  })

  // Binhi fields
  const [binhiFields, setBinhiFields] = useState({
    actualBeneficiaries: "",
    areaUtilized: "",
    totalNoBinhiPlanted: "",
    noBinhiSitesEstablished: "",
    expectedYieldPerSqm: "",
    projectedHarvest: "",
  })

  // Fetch sites if none passed
  useEffect(() => {
    if (projectSites.length === 0) {
      let mounted = true
      setLoadingSites(true)
      fetch('/api/sites')
        .then(r => r.ok ? r.json() : [])
        .then((data) => {
          if (!mounted) return
            const mapped = (data || []).map((s: any) => ({ id: s.id, siteName: s.siteName }))
            setSites(mapped)
            if (mapped.length && !selectedSiteId) setSelectedSiteId(mapped[0].id)
        })
        .catch(() => {})
        .finally(() => mounted && setLoadingSites(false))
      return () => { mounted = false }
    }
  }, [projectSites, selectedSiteId])

  useEffect(() => {
    let ignore = false
    setRegionsLoading(true)
    fetch('/api/psgc/regions')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch regions'))))
      .then((data) => {
        if (ignore) return
        setRegions(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (ignore) return
        setSiteError((prev) => prev ?? 'Failed to load regions. Please refresh the page.')
      })
      .finally(() => {
        if (!ignore) setRegionsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    setProvinces([])
    setSelectedProvinceCode(undefined)
    setMunicipalities([])
    setSelectedMunicipalityCode(undefined)
    setBarangays([])
    setSelectedBarangayCode(undefined)

    if (!selectedRegionCode) {
      return
    }

    let ignore = false
    setProvincesLoading(true)
    fetch(`/api/psgc/provinces?regionCode=${encodeURIComponent(selectedRegionCode)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch provinces'))))
      .then((data) => {
        if (ignore) return
        setProvinces(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (ignore) return
        setSiteError((prev) => prev ?? 'Failed to load provinces. Please try again.')
      })
      .finally(() => {
        if (!ignore) setProvincesLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedRegionCode])

  useEffect(() => {
    const usingRegionFallback =
      !selectedProvinceCode && !!selectedRegionCode && provinces.length === 0 && !provincesLoading

    if (!selectedProvinceCode && !usingRegionFallback) {
      setMunicipalities([])
      setSelectedMunicipalityCode(undefined)
      setBarangays([])
      setSelectedBarangayCode(undefined)
      return
    }

    setMunicipalities([])
    setSelectedMunicipalityCode(undefined)
    setBarangays([])
    setSelectedBarangayCode(undefined)

    let ignore = false
    setMunicipalitiesLoading(true)
    const query = selectedProvinceCode
      ? `provinceCode=${encodeURIComponent(selectedProvinceCode)}`
      : `regionCode=${encodeURIComponent(selectedRegionCode ?? '')}`

    fetch(`/api/psgc/municipalities?${query}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch municipalities'))))
      .then((data) => {
        if (ignore) return
        setMunicipalities(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (ignore) return
        setSiteError((prev) => prev ?? 'Failed to load municipalities. Please try again.')
      })
      .finally(() => {
        if (!ignore) setMunicipalitiesLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedProvinceCode, selectedRegionCode, provinces, provincesLoading])

  useEffect(() => {
    setBarangays([])
    setSelectedBarangayCode(undefined)

    if (!selectedMunicipalityCode) {
      return
    }

    let ignore = false
    setBarangaysLoading(true)
    fetch(`/api/psgc/barangays?municipalityCode=${encodeURIComponent(selectedMunicipalityCode)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch barangays'))))
      .then((data) => {
        if (ignore) return
        setBarangays(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (ignore) return
        setSiteError((prev) => prev ?? 'Failed to load barangays. Please try again.')
      })
      .finally(() => {
        if (!ignore) setBarangaysLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedMunicipalityCode])

  const handleCreateSite = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSiteError(null)
    if (!newSiteName.trim()) {
      setSiteError('Site name required')
      return
    }
    if (!selectedRegionCode || !selectedMunicipalityCode || !selectedBarangayCode) {
      setSiteError('Please complete the region, municipality, and barangay for the site.')
      return
    }

    const regionOption = regions.find((option) => option.code === selectedRegionCode)
    const provinceOption = selectedProvinceCode ? provinces.find((option) => option.code === selectedProvinceCode) : undefined
    const municipalityOption = municipalities.find((option) => option.code === selectedMunicipalityCode)
    const barangayOption = barangays.find((option) => option.code === selectedBarangayCode)

    if (!municipalityOption || !barangayOption) {
      setSiteError('Invalid geographic selection. Please reselect the location.')
      return
    }

    setCreatingSite(true)
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: newSiteName,
          regionCode: regionOption?.code,
          provinceCode: provinceOption?.code,
          cityMunicipalityCode: municipalityOption.code,
          barangayCode: barangayOption.code,
          province: provinceOption?.name,
          cityMunicipality: municipalityOption.name,
          barangay: barangayOption.name,
        }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        const message = (payload && typeof payload === 'object' && 'error' in payload)
          ? (payload as any).error
          : 'Failed to create site'
        throw new Error(message)
      }
      const created = payload
      const entry = { id: created.id, siteName: created.siteName }
      setSites(prev => [entry, ...prev])
      setSelectedSiteId(entry.id)
      setShowCreateSite(false)
      setNewSiteName("")
      setSelectedRegionCode(undefined)
      setSelectedProvinceCode(undefined)
      setSelectedMunicipalityCode(undefined)
      setSelectedBarangayCode(undefined)
      setProvinces([])
      setMunicipalities([])
      setBarangays([])
      toast({
        title: 'Site created',
        description: `${created.siteName} is ready for new projects.`,
      })
    } catch (e: any) {
      setSiteError(e.message || 'Error')
      toast({
        title: 'Failed to create site',
        description: e?.message || 'Please try again in a moment.',
        variant: 'destructive',
      })
    } finally {
      setCreatingSite(false)
    }
  }

  const proceedToProjects = () => {
    if (!selectedSiteId) {
      setSiteError('Select or create a site first.')
      return
    }
    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      proceedToProjects()
      return
    }
    if (!selectedSiteId) {
      toast({
        title: 'Select a site',
        description: 'Choose a project site before creating projects.',
        variant: 'destructive',
      })
      return
    }
    if (!createLawa && !createBinhi) {
      toast({
        title: 'Nothing to create yet',
        description: 'Turn on at least one project type before submitting.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    const successes: string[] = []
    const errors: string[] = []
    const siteDisplayName = sites.find((s) => s.id === selectedSiteId)?.siteName ?? 'selected site'

    try {
      if (createLawa) {
        const body = {
          projectSiteId: selectedSiteId,
          typeOfLawa: lawaFields.typeOfLawa || undefined,
          noOfLawa: lawaFields.noOfLawa ? Number(lawaFields.noOfLawa) : undefined,
          lengthM: lawaFields.length ? Number(lawaFields.length) : undefined,
          widthM: lawaFields.width ? Number(lawaFields.width) : undefined,
          depthM: lawaFields.depth ? Number(lawaFields.depth) : undefined,
          physicalTarget: lawaFields.partnerBeneficiaries ? Number(lawaFields.partnerBeneficiaries) : undefined,
          projectedHarvest: lawaFields.projectedHarvest ? Number(lawaFields.projectedHarvest) : undefined,
          status: status || 'Planning',
          remarks: remarks || undefined,
        }
        const res = await fetch('/api/projects/lawa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const payload = await res.json().catch(() => null)
        if (!res.ok || !payload) {
          const message = payload && typeof payload === 'object' && 'error' in payload
            ? (payload as any).error
            : 'Failed to create Lawa project.'
          errors.push(message)
        } else {
          const created = payload
          if (onAddLawa) {
            onAddLawa({
              id: created.id,
              projectSiteId: created.projectSiteId,
              siteName:
                created.projectSite?.siteName ||
                sites.find((s) => s.id === created.projectSiteId)?.siteName ||
                created.projectSiteId,
              physicalTarget: created.physicalTarget ?? 0,
              actualTarget: created.actualTarget ?? 0,
              typeOfLawa: created.typeOfLawa || '',
              length: Number(created.lengthM ?? 0),
              width: Number(created.widthM ?? 0),
              depth: Number(created.depthM ?? 0),
              capacityWaterVolume: Number(created.capacityWaterVolume ?? 0),
              noOfLawa: created.noOfLawa ?? 0,
              noProducedAquaticResources: created.noProducedAquaticResources ?? 0,
              noFacilitiesEstablished: created.noFacilitiesEstablished ?? 0,
              noFacilitiesRepaired: created.noFacilitiesRepaired ?? 0,
              areaUtilized: Number(created.areaUtilizedSqm ?? 0),
              projectedHarvest: Number(created.projectedHarvest ?? 0),
              actualHarvest: Number(created.actualHarvest ?? 0),
              status: created.status || 'Planning',
              remarks: created.remarks || null,
            })
          }
          successes.push('Lawa')
        }
      }

      if (createBinhi) {
        const body = {
          projectSiteId: selectedSiteId,
          actualBeneficiaries: binhiFields.actualBeneficiaries ? Number(binhiFields.actualBeneficiaries) : undefined,
          areaUtilizedSqm: binhiFields.areaUtilized ? Number(binhiFields.areaUtilized) : undefined,
          totalNoBinhiPlanted: binhiFields.totalNoBinhiPlanted ? Number(binhiFields.totalNoBinhiPlanted) : undefined,
          noBinhiSitesEstablished: binhiFields.noBinhiSitesEstablished ? Number(binhiFields.noBinhiSitesEstablished) : undefined,
          expectedYieldPerSqmKg: binhiFields.expectedYieldPerSqm ? Number(binhiFields.expectedYieldPerSqm) : undefined,
          projectedHarvestKg: binhiFields.projectedHarvest ? Number(binhiFields.projectedHarvest) : undefined,
          status: status || 'Planning',
          remarks: remarks || undefined,
        }
        const res = await fetch('/api/projects/binhi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const payload = await res.json().catch(() => null)
        if (!res.ok || !payload) {
          const message = payload && typeof payload === 'object' && 'error' in payload
            ? (payload as any).error
            : 'Failed to create Binhi project.'
          errors.push(message)
        } else {
          const created = payload
          if (onAddBinhi) {
            onAddBinhi({
              id: created.id,
              projectSiteId: created.projectSiteId,
              siteName:
                created.projectSite?.siteName ||
                sites.find((s) => s.id === created.projectSiteId)?.siteName ||
                created.projectSiteId,
              actualBeneficiaries: created.actualBeneficiaries ?? 0,
              areaUtilized: Number(created.areaUtilizedSqm ?? 0),
              totalNoBinhiPlanted: created.totalNoBinhiPlanted ?? 0,
              totalNoBinhiHarvested: created.totalNoBinhiHarvested ?? 0,
              noBinhiSitesEstablished: created.noBinhiSitesEstablished ?? 0,
              expectedYieldPerSqm: Number(created.expectedYieldPerSqmKg ?? 0),
              projectedHarvest: Number(created.projectedHarvestKg ?? 0),
              actualHarvest: Number(created.actualHarvestKg ?? 0),
              status: created.status || 'Planning',
              remarks: created.remarks || null,
            })
          }
          successes.push('Binhi')
        }
      }

      if (successes.length) {
        const label = successes.length > 1 ? 'projects' : 'project'
        toast({
          title: `${successes.join(' and ')} ${label} created`,
          description: `Saved for ${siteDisplayName}.`,
        })
      }

      if (errors.length) {
        toast({
          title: "Couldn't create project",
          description: errors.join(' '),
          variant: 'destructive',
        })
      }

      if (errors.length === 0 && successes.length) {
        onClose()
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Unexpected error',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while saving the project.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const regionHasNoProvinces = !!selectedRegionCode && provinces.length === 0 && !provincesLoading
  const municipalitySelectDisabled = municipalitiesLoading || (!selectedProvinceCode && !regionHasNoProvinces)

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Step 1 – Set up project site</h3>
              <p className="text-sm text-muted-foreground">Select an existing site or create a new one.</p>
            </div>
            <Badge variant="secondary">Step 1</Badge>
          </div>
          <div className="space-y-2">
            <Label>Project site</Label>
            <Select value={selectedSiteId} onValueChange={(v) => setSelectedSiteId(v)}>
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder={loadingSites ? 'Loading sites...' : 'Select site'} />
              </SelectTrigger>
              <SelectContent>
                {sites.length === 0 && !loadingSites && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No sites yet.</div>
                )}
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.siteName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateSite(s => !s)}>
              {showCreateSite ? 'Cancel new site' : 'Create new site'}
            </Button>
            <Button type="button" onClick={proceedToProjects} disabled={!selectedSiteId}>Continue</Button>
          </div>
          {showCreateSite && (
            <div className="space-y-4 rounded-md border p-4 bg-muted/40">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newSiteName">Site name</Label>
                  <Input id="newSiteName" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} placeholder="e.g. Coastal Barangay 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newRegion">Region</Label>
                  <Select
                    value={selectedRegionCode}
                    onValueChange={(value) => setSelectedRegionCode(value)}
                    disabled={regionsLoading}
                  >
                    <SelectTrigger id="newRegion" className="h-11 text-base">
                      <SelectValue placeholder={regionsLoading ? 'Loading regions…' : 'Select region'} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.length === 0 && !regionsLoading && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No regions available.</div>
                      )}
                      {regions.map((region) => (
                        <SelectItem key={region.code} value={region.code}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newProvince">Province</Label>
                  <Select
                    value={selectedProvinceCode}
                    onValueChange={(value) => setSelectedProvinceCode(value)}
                    disabled={!selectedRegionCode || provincesLoading || regionHasNoProvinces}
                  >
                    <SelectTrigger id="newProvince" className="h-11 text-base">
                      <SelectValue
                        placeholder={
                          !selectedRegionCode
                            ? 'Select region first'
                            : provincesLoading
                              ? 'Loading provinces…'
                              : regionHasNoProvinces
                                ? 'No provinces for this region'
                                : 'Select province'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedRegionCode && provinces.length === 0 && !provincesLoading && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No provinces for this region.</div>
                      )}
                      {provinces.map((province) => (
                        <SelectItem key={province.code} value={province.code}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {regionHasNoProvinces && (
                    <p className="text-xs text-muted-foreground">
                      This region has no province-level units. Proceed to select a municipality below.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newMunicipality">City / Municipality</Label>
                  <Select
                    value={selectedMunicipalityCode}
                    onValueChange={(value) => setSelectedMunicipalityCode(value)}
                    disabled={municipalitySelectDisabled}
                  >
                    <SelectTrigger id="newMunicipality" className="h-11 text-base">
                      <SelectValue
                        placeholder={
                          !selectedRegionCode
                            ? 'Select region first'
                            : municipalitiesLoading
                              ? 'Loading municipalities…'
                              : (!selectedProvinceCode && !regionHasNoProvinces)
                                ? 'Select province first'
                                : municipalities.length === 0
                                  ? 'No municipalities found'
                                  : 'Select municipality'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedProvinceCode || regionHasNoProvinces) && municipalities.length === 0 && !municipalitiesLoading && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No municipalities for this selection.</div>
                      )}
                      {municipalities.map((municipality) => (
                        <SelectItem key={municipality.code} value={municipality.code}>
                          {municipality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newBarangay">Barangay</Label>
                <Select
                  value={selectedBarangayCode}
                  onValueChange={(value) => setSelectedBarangayCode(value)}
                  disabled={barangaysLoading || !selectedMunicipalityCode}
                >
                  <SelectTrigger id="newBarangay" className="h-11 text-base">
                    <SelectValue placeholder={!selectedMunicipalityCode ? 'Select municipality first' : barangaysLoading ? 'Loading barangays…' : 'Select barangay'} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedMunicipalityCode && barangays.length === 0 && !barangaysLoading && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No barangays for this municipality.</div>
                    )}
                    {barangays.map((barangay) => (
                      <SelectItem key={barangay.psgcId} value={barangay.code}>
                        {barangay.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {siteError && <div className="text-sm text-destructive">{siteError}</div>}
              <div className="flex justify-end">
                <Button type="button" onClick={() => handleCreateSite()} disabled={creatingSite}>{creatingSite ? 'Creating...' : 'Save Site'}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Step 2 – Establish project(s)</h3>
              <p className="text-sm text-muted-foreground">Configure Lawa and/or Binhi project details for the site.</p>
            </div>
            <Badge variant="secondary">Step 2</Badge>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4" checked={createLawa} onChange={() => setCreateLawa(v => !v)} /> Lawa Project
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" className="h-4 w-4" checked={createBinhi} onChange={() => setCreateBinhi(v => !v)} /> Binhi Project
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger id="status" className="h-11 text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea id="remarks" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes..." />
            </div>
          </div>
          {createLawa && (
            <div className="space-y-4 rounded-xl border p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2"><Droplets className="h-4 w-4 text-chart-1" /> Lawa Specifications</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input value={lawaFields.typeOfLawa} onChange={e=>setLawaFields(f=>({...f,typeOfLawa:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>No. of Lawa</Label>
                  <Input type="number" value={lawaFields.noOfLawa} onChange={e=>setLawaFields(f=>({...f,noOfLawa:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Partner Beneficiaries (Physical Target)</Label>
                  <Input
                    type="number"
                    value={lawaFields.partnerBeneficiaries}
                    onChange={e => setLawaFields(f => ({ ...f, partnerBeneficiaries: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Length (m)</Label>
                  <Input type="number" value={lawaFields.length} onChange={e=>setLawaFields(f=>({...f,length:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Width (m)</Label>
                  <Input type="number" value={lawaFields.width} onChange={e=>setLawaFields(f=>({...f,width:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Depth (m)</Label>
                  <Input type="number" value={lawaFields.depth} onChange={e=>setLawaFields(f=>({...f,depth:e.target.value}))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Projected Harvest (kg)</Label>
                <Input type="number" value={lawaFields.projectedHarvest} onChange={e=>setLawaFields(f=>({...f,projectedHarvest:e.target.value}))} />
              </div>
            </div>
          )}
          {createBinhi && (
            <div className="space-y-4 rounded-xl border p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2"><Sprout className="h-4 w-4 text-chart-2" /> Binhi Specifications</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Beneficiaries</Label>
                  <Input type="number" value={binhiFields.actualBeneficiaries} onChange={e=>setBinhiFields(f=>({...f,actualBeneficiaries:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Area Utilized (sqm)</Label>
                  <Input type="number" value={binhiFields.areaUtilized} onChange={e=>setBinhiFields(f=>({...f,areaUtilized:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Sites Established</Label>
                  <Input type="number" value={binhiFields.noBinhiSitesEstablished} onChange={e=>setBinhiFields(f=>({...f,noBinhiSitesEstablished:e.target.value}))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Total Planted</Label>
                  <Input type="number" value={binhiFields.totalNoBinhiPlanted} onChange={e=>setBinhiFields(f=>({...f,totalNoBinhiPlanted:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Yield / sqm (kg)</Label>
                  <Input type="number" value={binhiFields.expectedYieldPerSqm} onChange={e=>setBinhiFields(f=>({...f,expectedYieldPerSqm:e.target.value}))} />
                </div>
                <div className="space-y-2">
                  <Label>Projected Harvest (kg)</Label>
                  <Input type="number" value={binhiFields.projectedHarvest} onChange={e=>setBinhiFields(f=>({...f,projectedHarvest:e.target.value}))} />
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || (!createLawa && !createBinhi)}>
                {isSubmitting ? 'Saving...' : `Create ${createLawa && createBinhi ? 'Projects' : 'Project'}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

function LawaProjectFields() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="typeOfLawa">Type of Lawa</Label>
          <Input id="typeOfLawa" placeholder="e.g., Fishpond, Aquaculture Pond" className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="noOfLawa">Number of lawa basins</Label>
          <Input id="noOfLawa" type="number" placeholder="Enter number" className="h-11 text-base" />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-white/60 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Footprint dimensions</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="length">Length (m)</Label>
            <Input id="length" type="number" step="0.1" placeholder="0.0" className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Width (m)</Label>
            <Input id="width" type="number" step="0.1" placeholder="0.0" className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depth">Depth (m)</Label>
            <Input id="depth" type="number" step="0.1" placeholder="0.0" className="h-11 text-base" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="physicalTarget">Physical target (units)</Label>
          <Input id="physicalTarget" type="number" placeholder="Enter target" className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectedHarvest">Projected harvest (kg)</Label>
          <Input id="projectedHarvest" type="number" placeholder="Enter projected harvest" className="h-11 text-base" />
        </div>
      </div>
    </div>
  )
}

function BinhiProjectFields() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="actualBeneficiaries">Number of beneficiaries</Label>
          <Input id="actualBeneficiaries" type="number" placeholder="Enter number" className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="areaUtilized">Area utilized (sqm)</Label>
          <Input id="areaUtilized" type="number" placeholder="Enter area" className="h-11 text-base" />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-white/60 dark:bg-slate-950/40 p-4 sm:p-5 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Planting & site setup</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="totalNoBinhiPlanted">Total binhi planted</Label>
            <Input id="totalNoBinhiPlanted" type="number" placeholder="Enter count" className="h-11 text-base" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noBinhiSitesEstablished">Sites established</Label>
            <Input id="noBinhiSitesEstablished" type="number" placeholder="Enter sites" className="h-11 text-base" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expectedYieldPerSqm">Expected yield per sqm (kg)</Label>
          <Input id="expectedYieldPerSqm" type="number" step="0.1" placeholder="0.0" className="h-11 text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectedHarvest">Projected harvest (kg)</Label>
          <Input id="projectedHarvest" type="number" placeholder="Enter projected harvest" className="h-11 text-base" />
        </div>
      </div>
    </div>
  )
}

function ProjectDetailsView({
  project,
}: {
  project: ProjectsManagementLawaProject | ProjectsManagementBinhiProject
}) {
  const isLawaProject = "typeOfLawa" in project
  const [participants, setParticipants] = useState<any[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)

  const fetchParticipants = async () => {
    setLoadingParticipants(true)
    try {
      const path = isLawaProject
        ? `/api/projects/lawa/${encodeURIComponent(project.id)}/beneficiaries`
        : `/api/projects/binhi/${encodeURIComponent(project.id)}/beneficiaries`
      const res = await fetch(path)
      const data = await res.json()
      setParticipants(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingParticipants(false)
    }
  }

  useEffect(() => { fetchParticipants() }, [project?.id])

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Project ID</Label>
          <p className="text-sm">{project.id}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <Badge
            className={`${project.status === "Completed" ? "bg-primary text-primary-foreground" : project.status === "In Progress" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"} mt-1`}
          >
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Project Site</Label>
          <p className="text-sm">
            {project.projectSiteId} - {project.siteName}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Project Type</Label>
          <p className="text-sm">{isLawaProject ? "Lawa (Water-related)" : "Binhi (Agriculture)"}</p>
        </div>
      </div>

      {/* Project-specific details */}
      {isLawaProject ? (
        <LawaProjectDetails project={project as ProjectsManagementLawaProject} />
      ) : (
        <BinhiProjectDetails project={project as ProjectsManagementBinhiProject} />
      )}

      {/* Harvest Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Projected Harvest</Label>
          <p className="text-2xl font-bold text-accent">{project.projectedHarvest} kg</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Actual Harvest</Label>
          <p className="text-2xl font-bold text-primary">{project.actualHarvest} kg</p>
        </div>
      </div>

      {project.remarks && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Remarks</Label>
          <p className="text-sm">{project.remarks}</p>
        </div>
      )}

      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium">Participants</h4>
        <p className="text-xs text-muted-foreground">Beneficiaries linked to this project.</p>
        <div className="mt-3">
          {loadingParticipants ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : participants.length === 0 ? (
            <div className="text-sm text-muted-foreground">No participants yet.</div>
          ) : (
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{p.name ?? p.id}</div>
                    <div className="text-xs text-muted-foreground">Linked: {p.dateLinked ? new Date(p.dateLinked).toLocaleDateString() : '—'}</div>
                  </div>
                  <div className="text-sm">{p.participationStatus ?? ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LawaProjectDetails({ project }: { project: ProjectsManagementLawaProject }) {
  return (
    <>
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Type of Lawa</Label>
        <p className="text-sm">{project.typeOfLawa}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Dimensions</Label>
          <p className="text-sm">
            {project.length}m × {project.width}m × {project.depth}m
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Water Capacity</Label>
          <p className="text-sm">{project.capacityWaterVolume} cubic meters</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Number of Lawa</Label>
          <p className="text-sm">{project.noOfLawa}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Physical Target</Label>
          <p className="text-sm">
            {project.actualTarget} / {project.physicalTarget}
          </p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Area Utilized</Label>
          <p className="text-sm">{project.areaUtilized} sqm</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Aquatic Resources Produced</Label>
          <p className="text-sm">{project.noProducedAquaticResources}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Facilities Established</Label>
          <p className="text-sm">{project.noFacilitiesEstablished}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Facilities Repaired</Label>
          <p className="text-sm">{project.noFacilitiesRepaired}</p>
        </div>
      </div>
    </>
  )
}

function BinhiProjectDetails({ project }: { project: ProjectsManagementBinhiProject }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Beneficiaries</Label>
          <p className="text-sm">{project.actualBeneficiaries}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Area Utilized</Label>
          <p className="text-sm">{project.areaUtilized} sqm</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Sites Established</Label>
          <p className="text-sm">{project.noBinhiSitesEstablished}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Binhi Planted</Label>
          <p className="text-sm">{project.totalNoBinhiPlanted}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Binhi Harvested</Label>
          <p className="text-sm">{project.totalNoBinhiHarvested}</p>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Expected Yield per sqm</Label>
        <p className="text-sm">{project.expectedYieldPerSqm} kg/sqm</p>
      </div>
    </>
  )
}

function ParticipantsManager({
  project,
  isLawa,
  onClose,
}: {
  project: ProjectsManagementLawaProject | ProjectsManagementBinhiProject
  isLawa: boolean
  onClose: () => void
}) {
  const hasProjectSite = Boolean(project.projectSiteId)
  const projectType = isLawa ? "LAWA" : "BINHI"
  const { toast } = useToast()
  const [participants, setParticipants] = useState<ProjectParticipantRecord[]>([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [siteBeneficiaries, setSiteBeneficiaries] = useState<SiteBeneficiaryCandidate[]>([])
  const [loadingSiteBeneficiaries, setLoadingSiteBeneficiaries] = useState(false)
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([])
  const [assignStatus, setAssignStatus] = useState<string>("ACTIVE")
  const [assignDate, setAssignDate] = useState<string>(() => new Date().toISOString().split("T")[0])
  const [assigning, setAssigning] = useState(false)
  const [filterMode, setFilterMode] = useState<"all" | "linked" | "unlinked">("unlinked")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const fetchParticipants = useCallback(async () => {
    setLoadingParticipants(true)
    try {
      const path = isLawa
        ? `/api/projects/lawa/${encodeURIComponent(project.id)}/beneficiaries`
        : `/api/projects/binhi/${encodeURIComponent(project.id)}/beneficiaries`
      const res = await fetch(path)
      const data = await res.json().catch(() => null)
      const parsed: ProjectParticipantRecord[] = Array.isArray(data)
        ? data
            .map((entry) => {
              const record = entry as Record<string, unknown>
              const id = typeof record.id === "string" ? record.id : ""
              if (!id) return null
              const name = typeof record.name === "string" ? record.name : null
              const ageValue = record.age
              const age =
                typeof ageValue === "number"
                  ? ageValue
                  : typeof ageValue === "string" && ageValue.trim()
                    ? Number(ageValue)
                    : null
              const sex = typeof record.sex === "string" ? record.sex : null
              const status =
                typeof record.participationStatus === "string" ? record.participationStatus : null
              const rawDate = record.dateLinked
              let dateLinked: string | null = null
              if (typeof rawDate === "string") {
                dateLinked = rawDate
              } else if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
                dateLinked = rawDate.toISOString()
              }
              return { id, name, age, sex, participationStatus: status, dateLinked }
            })
            .filter((entry): entry is ProjectParticipantRecord => Boolean(entry))
        : []
      setParticipants(parsed)
    } catch (error: unknown) {
      console.error(error)
      toast({ title: "Failed to load project participants", variant: "destructive" })
    } finally {
      setLoadingParticipants(false)
    }
  }, [isLawa, project.id, toast])

  const fetchSiteBeneficiaries = useCallback(async () => {
    if (!project.projectSiteId) {
      setSiteBeneficiaries([])
      return
    }
    setLoadingSiteBeneficiaries(true)
    try {
      const params = new URLSearchParams({ projectId: project.id, projectType })
      const res = await fetch(
        `/api/sites/${encodeURIComponent(project.projectSiteId)}/beneficiaries?${params.toString()}`,
      )
      const data = await res.json().catch(() => null)
      const parsed: SiteBeneficiaryCandidate[] = Array.isArray(data)
        ? data
            .map((entry) => {
              const record = entry as Record<string, unknown>
              const id = typeof record.id === "string" ? record.id : ""
              if (!id) return null
              const name = typeof record.name === "string" ? record.name : null
              const ageValue = record.age
              const age =
                typeof ageValue === "number"
                  ? ageValue
                  : typeof ageValue === "string" && ageValue.trim()
                    ? Number(ageValue)
                    : null
              const sex = typeof record.sex === "string" ? record.sex : null
              const enrollmentStatus =
                typeof record.enrollmentStatus === "string" ? record.enrollmentStatus : null
              const rawDateEnrolled = record.dateEnrolled
              let dateEnrolled: string | null = null
              if (typeof rawDateEnrolled === "string") {
                dateEnrolled = rawDateEnrolled
              } else if (rawDateEnrolled instanceof Date && !Number.isNaN(rawDateEnrolled.getTime())) {
                dateEnrolled = rawDateEnrolled.toISOString()
              }
              const linkedToTarget = Boolean(record.linkedToTarget)
              return { id, name, age, sex, enrollmentStatus, dateEnrolled, linkedToTarget }
            })
            .filter((entry): entry is SiteBeneficiaryCandidate => Boolean(entry))
        : []
      setSiteBeneficiaries(parsed)
    } catch (error: unknown) {
      console.error(error)
      toast({ title: "Failed to load site beneficiaries", variant: "destructive" })
    } finally {
      setLoadingSiteBeneficiaries(false)
    }
  }, [project.projectSiteId, project.id, projectType, toast])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  useEffect(() => {
    fetchSiteBeneficiaries()
  }, [fetchSiteBeneficiaries])

  useEffect(() => {
    setSelectedBeneficiaryIds((prev) =>
      prev.filter((id) => {
        const candidate = siteBeneficiaries.find((entry) => entry.id === id)
        return candidate && !candidate.linkedToTarget
      }),
    )
  }, [siteBeneficiaries])

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return siteBeneficiaries.filter((candidate) => {
      if (filterMode === "linked" && !candidate.linkedToTarget) return false
      if (filterMode === "unlinked" && candidate.linkedToTarget) return false
      if (!normalizedSearch) return true
      const nameMatch = candidate.name ? candidate.name.toLowerCase().includes(normalizedSearch) : false
      const idMatch = candidate.id.toLowerCase().includes(normalizedSearch)
      return nameMatch || idMatch
    })
  }, [siteBeneficiaries, filterMode, searchTerm])

  const toggleCandidate = (id: string, disabled: boolean) => {
    if (disabled) return
    setSelectedBeneficiaryIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  const selectAllFiltered = () => {
    setSelectedBeneficiaryIds(
      filteredCandidates.filter((candidate) => !candidate.linkedToTarget).map((candidate) => candidate.id),
    )
  }

  const clearSelection = () => setSelectedBeneficiaryIds([])

  const handleAssign = async () => {
    if (!project.projectSiteId) {
      toast({ title: "Project site missing", description: "Cannot determine project site for assignment.", variant: "destructive" })
      return
    }

    if (selectedBeneficiaryIds.length === 0) {
      toast({ title: "Select beneficiaries", description: "Choose at least one beneficiary to assign.", variant: "destructive" })
      return
    }

    setAssigning(true)
    try {
      const payload: Record<string, unknown> = {
        projectId: project.id,
        projectType,
        beneficiaryIds: selectedBeneficiaryIds,
        participationStatus: assignStatus,
      }
      if (assignDate) {
        payload.dateLinked = assignDate
      }

      const res = await fetch(
        `/api/sites/${encodeURIComponent(project.projectSiteId)}/projects/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      const result = await res.json().catch(() => null)
      if (!res.ok || !result) {
        const message =
          result && typeof result === "object" && "error" in result
            ? (result as Record<string, unknown>).error
            : null
        throw new Error(typeof message === "string" ? message : "Failed to assign beneficiaries")
      }

  const { created, skipped, missingEnrollment, linkedCount } = result as Record<string, unknown>
      const createdCount = typeof created === "number" ? created : 0
      const skippedCount = typeof skipped === "number" ? skipped : 0
      const missing = Array.isArray(missingEnrollment) ? missingEnrollment.length : 0

      toast({
        title: "Participants linked",
        description: `${createdCount} linked, ${skippedCount} skipped${missing ? `, ${missing} without enrollment` : ""}.`,
      })

      setSelectedBeneficiaryIds([])
      fetchParticipants()
      fetchSiteBeneficiaries()
      // notify other components to update counts
      try {
        ;(window as any).dispatchEvent(new CustomEvent('projectLinked', { detail: { projectId: project.id, projectType, linkedCount } }))
      } catch (e) {
        /* ignore */
      }
    } catch (error: unknown) {
      console.error(error)
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Unable to assign beneficiaries to this project.",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  const handleRefresh = () => {
    fetchParticipants()
    fetchSiteBeneficiaries()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold">Participants for {project.id}</h4>
          <p className="text-sm text-muted-foreground">
            Site: {project.projectSiteId} • Type: {projectType}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loadingParticipants || loadingSiteBeneficiaries}>
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCreateOpen(true)}
            disabled={!hasProjectSite}
            title={hasProjectSite ? undefined : "Assign a project site before creating beneficiaries."}
          >
            New beneficiary
          </Button>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-muted/10 p-4">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold">Currently linked</h5>
          <span className="text-xs text-muted-foreground">{participants.length} beneficiaries</span>
        </div>
        {loadingParticipants ? (
          <div className="text-sm text-muted-foreground">Loading participants…</div>
        ) : participants.length === 0 ? (
          <div className="text-sm text-muted-foreground">No beneficiaries linked to this project yet.</div>
        ) : (
          <div className="space-y-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
                <div>
                  <div className="font-medium">{participant.name ?? participant.id}</div>
                  <div className="text-xs text-muted-foreground">
                    Linked {participant.dateLinked ? new Date(participant.dateLinked).toLocaleDateString() : "—"}
                    {participant.participationStatus ? ` • ${participant.participationStatus}` : ""}
                  </div>
                </div>
                {participant.sex && <Badge variant="outline">{participant.sex}</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h5 className="text-sm font-semibold">Assign beneficiaries from site enrollment</h5>
            <p className="text-xs text-muted-foreground">
              Only beneficiaries enrolled in this site can be linked to the project.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={filterMode} onValueChange={(value) => setFilterMode(value as typeof filterMode)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Show all</SelectItem>
                <SelectItem value="unlinked">Not yet assigned</SelectItem>
                <SelectItem value="linked">Already assigned</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search enrolled beneficiaries"
              className="md:w-72"
            />
          </div>
        </div>

        <div className="rounded-lg border">
          {loadingSiteBeneficiaries ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">Loading site beneficiaries…</div>
          ) : filteredCandidates.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground">No beneficiaries match your filters.</div>
          ) : (
            <div className="max-h-72 divide-y overflow-auto">
              {filteredCandidates.map((candidate) => {
                const disabled = candidate.linkedToTarget
                const checked = selectedBeneficiaryIds.includes(candidate.id)
                return (
                  <label
                    key={candidate.id}
                    className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-3 ${disabled ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={() => toggleCandidate(candidate.id, disabled)}
                        disabled={disabled}
                      />
                      <div>
                        <div className="font-medium">{candidate.name ?? candidate.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {candidate.sex ?? ""}
                          {candidate.age !== null ? ` • ${candidate.age} yrs` : ""}
                          {candidate.enrollmentStatus ? ` • ${candidate.enrollmentStatus}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {candidate.dateEnrolled ? new Date(candidate.dateEnrolled).toLocaleDateString() : "—"}
                      <br />
                      {candidate.linkedToTarget ? <Badge variant="secondary">Linked</Badge> : <span>Available</span>}
                    </div>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedBeneficiaryIds.length} beneficiary{selectedBeneficiaryIds.length === 1 ? "" : "ies"} selected
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAllFiltered} disabled={filteredCandidates.length === 0}>
              Select shown
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedBeneficiaryIds.length === 0}>
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Participation status</Label>
            <Select value={assignStatus} onValueChange={(value) => setAssignStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Link date</Label>
            <Input type="date" value={assignDate} onChange={(event) => setAssignDate(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={handleAssign} disabled={assigning || selectedBeneficiaryIds.length === 0}>
              {assigning ? "Linking beneficiaries…" : "Link selected"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent size="lg" className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create beneficiary for site</DialogTitle>
            <DialogDescription>
              New beneficiaries are enrolled into the project&apos;s site and linked to this project automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {project.projectSiteId ? (
              <CreateAndLinkForm
                projectId={project.id}
                siteId={project.projectSiteId}
                isLawa={isLawa}
                onCancel={() => setIsCreateOpen(false)}
                onCompleted={() => {
                  setIsCreateOpen(false)
                  fetchParticipants()
                  fetchSiteBeneficiaries()
                }}
              />
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>This project is not associated with a site yet.</p>
                <p>Assign a project site before creating beneficiaries from here.</p>
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CreateAndLinkForm({
  projectId,
  siteId,
  isLawa,
  onCancel,
  onCompleted,
}: {
  projectId: string
  siteId: string
  isLawa: boolean
  onCancel: () => void
  onCompleted: () => void
}) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [sex, setSex] = useState('MALE')
  const [age, setAge] = useState<number | ''>('')
  const [birthdate, setBirthdate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!name || !sex) return toast({ title: 'Name and sex required', variant: 'destructive' })
    if (!siteId) {
      toast({ title: 'Project site missing', description: 'Cannot determine project site for the new beneficiary.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        name,
        sex,
        projectSiteIds: [siteId],
        participationStatus: 'ACTIVE',
      }
      if (age) body.age = Number(age)
      if (birthdate) body.birthdate = birthdate

      const createRes = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const createdPayload = await createRes.json().catch(() => null)
      if (!createRes.ok || !createdPayload) {
        const message =
          createdPayload && typeof createdPayload === 'object' && 'error' in createdPayload
            ? (createdPayload as Record<string, unknown>).error
            : null
        throw new Error(typeof message === 'string' ? message : 'Failed to create beneficiary')
      }

      const beneficiaryId = (createdPayload as Record<string, unknown>).id
      if (typeof beneficiaryId !== 'string' || !beneficiaryId) {
        throw new Error('Beneficiary identifier missing from response')
      }

      const assignRes = await fetch(`/api/sites/${encodeURIComponent(siteId)}/projects/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectType: isLawa ? 'LAWA' : 'BINHI',
          beneficiaryIds: [beneficiaryId],
          participationStatus: 'ACTIVE',
        }),
      })
      const assignPayload = await assignRes.json().catch(() => null)
      if (!assignRes.ok || !assignPayload) {
        const message =
          assignPayload && typeof assignPayload === 'object' && 'error' in assignPayload
            ? (assignPayload as Record<string, unknown>).error
            : null
        throw new Error(typeof message === 'string' ? message : 'Failed to link beneficiary to project')
      }

      toast({ title: 'Beneficiary created', description: `Beneficiary ${beneficiaryId} is now linked to the project.` })
      setName('')
      setSex('MALE')
      setAge('')
      setBirthdate('')
      // notify other components (and parent) to update counts
      try {
        const linkedCount = (assignPayload as Record<string, unknown>)?.linkedCount
        ;(window as any).dispatchEvent(new CustomEvent('projectLinked', { detail: { projectId, projectType: isLawa ? 'LAWA' : 'BINHI', linkedCount } }))
      } catch (e) { /* ignore */ }
      onCompleted()
    } catch (error: unknown) {
      console.error(error)
      const message = error instanceof Error ? error.message : String(error)
      toast({ title: 'Create failed', description: message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Sex</Label>
          <Select value={sex} onValueChange={(v) => setSex(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">MALE</SelectItem>
              <SelectItem value="FEMALE">FEMALE</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Birthdate</Label>
          <Input type="date" value={birthdate} onChange={(event) => setBirthdate(event.target.value)} />
        </div>
        <div>
          <Label>Age</Label>
          <Input type="number" value={age === '' ? '' : String(age)} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create & Link'}</Button>
      </div>
    </form>
  )
}

function EditProjectForm({ project, onSaved, onCancel }: { project: any; onSaved: (p: any) => void; onCancel: () => void }) {
  const isLawa = 'typeOfLawa' in project
  const [form, setForm] = useState<any>({ ...project })
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

  const handleChange = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }))

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSubmitting(true)
    try {
      const path = isLawa ? `/api/projects/lawa/${encodeURIComponent(project.id)}` : `/api/projects/binhi/${encodeURIComponent(project.id)}`
      const res = await fetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Failed to update')
      toast({ title: 'Saved', description: `${project.id} updated.` })
      onSaved(payload)
    } catch (e: any) {
      console.error(e)
      toast({ title: 'Save failed', description: e?.message || String(e), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Project ID</Label>
          <Input value={project.id} disabled />
        </div>
        <div>
          <Label>Site</Label>
          <Input value={project.projectSiteId} disabled />
        </div>
      </div>

      {isLawa ? (
        <>
          <div>
            <Label>Type of Lawa</Label>
            <Input value={form.typeOfLawa ?? ''} onChange={(e) => handleChange('typeOfLawa', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Length (m)</Label>
              <Input type="number" value={form.lengthM ?? ''} onChange={(e) => handleChange('lengthM', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label>Width (m)</Label>
              <Input type="number" value={form.widthM ?? ''} onChange={(e) => handleChange('widthM', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label>Depth (m)</Label>
              <Input type="number" value={form.depthM ?? ''} onChange={(e) => handleChange('depthM', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Physical Target</Label>
              <Input type="number" value={form.physicalTarget ?? ''} onChange={(e) => handleChange('physicalTarget', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label>Actual Target</Label>
              <Input type="number" value={form.actualTarget ?? ''} onChange={(e) => handleChange('actualTarget', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Actual Beneficiaries</Label>
              <Input type="number" value={form.actualBeneficiaries ?? ''} onChange={(e) => handleChange('actualBeneficiaries', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label>Area Utilized (sqm)</Label>
              <Input type="number" value={form.areaUtilizedSqm ?? ''} onChange={(e) => handleChange('areaUtilizedSqm', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Planted</Label>
              <Input type="number" value={form.totalNoBinhiPlanted ?? ''} onChange={(e) => handleChange('totalNoBinhiPlanted', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label>Harvested</Label>
              <Input type="number" value={form.totalNoBinhiHarvested ?? ''} onChange={(e) => handleChange('totalNoBinhiHarvested', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        </>
      )}

      <div>
        <Label>Status</Label>
        <Select value={form.status ?? 'Planning'} onValueChange={(v) => handleChange('status', v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Planning">Planning</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Remarks</Label>
        <Textarea value={form.remarks ?? ''} onChange={(e) => handleChange('remarks', e.target.value)} />
      </div>

      <div className="pt-2">
        <Button type="button" variant="outline" onClick={() => setIsParticipantsOpen(true)}>Manage Participants</Button>
      </div>

      <Dialog open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
        <DialogContent size="lg" className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Manage Participants — {project.id}</DialogTitle>
            <DialogDescription>View, add, or link beneficiaries for this project.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ParticipantsManager project={project} isLawa={isLawa} onClose={() => setIsParticipantsOpen(false)} />
          </DialogBody>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save changes'}</Button>
      </div>
    </form>
  )
}
