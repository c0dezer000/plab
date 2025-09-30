"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Droplets, Sprout, Plus, Search, Edit, Eye, Target, TrendingUp, MapPin } from "lucide-react"

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
  const [lawaState, setLawaState] = useState(lawaProjects)
  const [binhiState, setBinhiState] = useState(binhiProjects)

  useEffect(() => {
    setLawaState(lawaProjects)
  }, [lawaProjects])

  useEffect(() => {
    setBinhiState(binhiProjects)
  }, [binhiProjects])

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
      return Math.round((project.totalNoBinhiHarvested / project.totalNoBinhiPlanted) * 100)
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
              <DialogDescription>Create a new Lawa or Binhi project</DialogDescription>
            </DialogHeader>
            <AddProjectForm onClose={() => setIsAddDialogOpen(false)} projectSites={projectSites} />
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
                                    {project.actualTarget}/{project.physicalTarget} target
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
                                    <Button variant="ghost" size="sm">
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
                                  <div className="text-xs text-muted-foreground mb-1">Harvest Rate</div>
                                  <Progress value={getProgressPercentage(project)} className="h-2 mb-1" />
                                  <div className="text-xs text-muted-foreground">
                                    {project.totalNoBinhiHarvested}/{project.totalNoBinhiPlanted} planted
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
                                    <Button variant="ghost" size="sm">
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
                            {project.actualTarget}/{project.physicalTarget} target
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
                            <span>Harvest Rate</span>
                            <span>{getProgressPercentage(project)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(project)} className="h-2" />
                          <div className="text-xs text-muted-foreground">
                            {project.totalNoBinhiHarvested}/{project.totalNoBinhiPlanted} planted
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
        </TabsContent>
      </Tabs>

      {/* View Project Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>Complete information for {selectedProject?.id}</DialogDescription>
          </DialogHeader>
          {selectedProject && <ProjectDetailsView project={selectedProject} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddProjectForm({
  onClose,
  projectSites = [],
}: {
  onClose: () => void
  projectSites?: ProjectsManagementProjectSite[]
}) {
  const [projectType, setProjectType] = useState<"lawa" | "binhi">("lawa")

  return (
    <form className="space-y-6">
      {/* Project Type Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Project Type</h3>
        <Select value={projectType} onValueChange={(value: "lawa" | "binhi") => setProjectType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lawa">Lawa Project (Water-related)</SelectItem>
            <SelectItem value="binhi">Binhi Project (Agriculture)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectSiteId">Project Site</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select project site" />
              </SelectTrigger>
              <SelectContent>
                {projectSites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.id} - {site.siteName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select>
              <SelectTrigger>
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
        </div>
      </div>

      {/* Conditional Fields based on Project Type */}
      {projectType === "lawa" ? <LawaProjectFields /> : <BinhiProjectFields />}

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" placeholder="Additional notes about this project..." />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Create Project</Button>
      </div>
    </form>
  )
}

function LawaProjectFields() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Lawa Project Specifications</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="typeOfLawa">Type of Lawa</Label>
          <Input id="typeOfLawa" placeholder="e.g., Fishpond, Aquaculture Pond" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="noOfLawa">Number of Lawa</Label>
          <Input id="noOfLawa" type="number" placeholder="Enter number" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="length">Length (m)</Label>
          <Input id="length" type="number" step="0.1" placeholder="Enter length" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width">Width (m)</Label>
          <Input id="width" type="number" step="0.1" placeholder="Enter width" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depth">Depth (m)</Label>
          <Input id="depth" type="number" step="0.1" placeholder="Enter depth" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="physicalTarget">Physical Target</Label>
          <Input id="physicalTarget" type="number" placeholder="Enter target" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectedHarvest">Projected Harvest (kg)</Label>
          <Input id="projectedHarvest" type="number" placeholder="Enter projected harvest" />
        </div>
      </div>
    </div>
  )
}

function BinhiProjectFields() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Binhi Project Specifications</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="actualBeneficiaries">Number of Beneficiaries</Label>
          <Input id="actualBeneficiaries" type="number" placeholder="Enter number of beneficiaries" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="areaUtilized">Area Utilized (sqm)</Label>
          <Input id="areaUtilized" type="number" placeholder="Enter area in square meters" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalNoBinhiPlanted">Total Binhi Planted</Label>
          <Input id="totalNoBinhiPlanted" type="number" placeholder="Enter number planted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="noBinhiSitesEstablished">Sites Established</Label>
          <Input id="noBinhiSitesEstablished" type="number" placeholder="Enter number of sites" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expectedYieldPerSqm">Expected Yield per sqm (kg)</Label>
          <Input id="expectedYieldPerSqm" type="number" step="0.1" placeholder="Enter yield per sqm" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectedHarvest">Projected Harvest (kg)</Label>
          <Input id="projectedHarvest" type="number" placeholder="Enter projected harvest" />
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
