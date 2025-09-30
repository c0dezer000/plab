"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  Plus,
  Search,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

export type ProjectTrackerStatus = "On Track" | "Behind Schedule" | "At Risk" | "Completed"

export interface ProjectTrackerRecord {
  id: string
  projectSiteId: string
  siteName: string
  projectType: "LAWA" | "BINHI"
  physicalTarget: number
  financialTargets: number
  socialPreps: string
  cftDrrCca: string
  cfw: string
  cftSustainability: string
  ffw: string
  physicalAccomplishment: number
  financialAccomplishment: number
  balance: number
  dateOfPayout: string | null
  remarks?: string | null
  status: ProjectTrackerStatus
}

interface ProjectTrackingProps {
  trackers: ProjectTrackerRecord[]
}

export function ProjectTracking({ trackers }: ProjectTrackingProps) {
  const [trackerState, setTrackerState] = useState<ProjectTrackerRecord[]>(trackers)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTracker, setSelectedTracker] = useState<ProjectTrackerRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    setTrackerState(trackers)
  }, [trackers])

  const filteredTrackers = useMemo(
    () =>
      trackerState.filter(
        (tracker) =>
          tracker.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tracker.projectSiteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tracker.id.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [trackerState, searchTerm],
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "bg-primary text-primary-foreground"
      case "Completed":
        return "bg-accent text-accent-foreground"
      case "Behind Schedule":
        return "bg-destructive text-destructive-foreground"
      case "At Risk":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "On Track":
      case "Completed":
        return <CheckCircle className="h-4 w-4" />
      case "Behind Schedule":
      case "At Risk":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleViewTracker = (tracker: ProjectTrackerRecord) => {
    setSelectedTracker(tracker)
    setIsViewDialogOpen(true)
  }

  const totalFinancialTarget = trackerState.reduce((sum, t) => sum + t.financialTargets, 0)
  const totalFinancialAccomplishment = trackerState.reduce((sum, t) => sum + t.financialAccomplishment, 0)
  const totalBalance = trackerState.reduce((sum, t) => sum + t.balance, 0)
  const averagePhysicalProgress =
    trackerState.length === 0
      ? 0
      : trackerState.reduce((sum, t) => sum + (t.physicalAccomplishment / t.physicalTarget) * 100, 0) /
        trackerState.length

  const financialTrendData = useMemo(() => {
    const monthMap = new Map<number, { month: string; target: number; actual: number }>()

    trackerState.forEach((tracker) => {
      if (!tracker.dateOfPayout) {
        return
      }

      const date = new Date(tracker.dateOfPayout)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const key = monthStart.getTime()
      const label = monthStart.toLocaleString("en-US", { month: "short", year: "numeric" })

      if (!monthMap.has(key)) {
        monthMap.set(key, { month: label, target: 0, actual: 0 })
      }

      const entry = monthMap.get(key)!
      entry.target += tracker.financialTargets
      entry.actual += tracker.financialAccomplishment
    })

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => value)
  }, [trackerState])

  const physicalProgressData = useMemo(() => {
    const siteMap = new Map<string, { site: string; target: number; accomplished: number }>()

    trackerState.forEach((tracker) => {
      if (!siteMap.has(tracker.projectSiteId)) {
        siteMap.set(tracker.projectSiteId, {
          site: tracker.projectSiteId,
          target: 0,
          accomplished: 0,
        })
      }

      const entry = siteMap.get(tracker.projectSiteId)!
      entry.target += tracker.physicalTarget
      entry.accomplished += tracker.physicalAccomplishment
    })

    return Array.from(siteMap.values())
  }, [trackerState])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Tracking</h2>
          <p className="text-muted-foreground">Monitor project progress and financial targets</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Tracker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Project Tracker</DialogTitle>
              <DialogDescription>Create a new tracking record for project monitoring</DialogDescription>
            </DialogHeader>
            <AddTrackerForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by site name, project ID, or tracker ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Target</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalFinancialTarget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total budget allocated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Accomplishment</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₱{totalFinancialAccomplishment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalFinancialTarget === 0
                ? 0
                : Math.round((totalFinancialAccomplishment / totalFinancialTarget) * 100)}% of target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">₱{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for disbursement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Physical Progress</CardTitle>
            <Target className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{Math.round(averagePhysicalProgress) || 0}%</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Progress Trend</CardTitle>
            <CardDescription>Monthly financial targets vs accomplishments</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                target: {
                  label: "Target",
                  color: "hsl(var(--chart-1))",
                },
                actual: {
                  label: "Actual",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={financialTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="target" stroke="var(--color-target)" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="var(--color-actual)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Physical Progress by Site</CardTitle>
            <CardDescription>Target vs accomplished physical progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                target: {
                  label: "Target",
                  color: "hsl(var(--chart-1))",
                },
                accomplished: {
                  label: "Accomplished",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={physicalProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="site" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="target" fill="var(--color-target)" />
                  <Bar dataKey="accomplished" fill="var(--color-accomplished)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tracking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Tracking Records</CardTitle>
          <CardDescription>Detailed tracking information for all project sites</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracker Info</TableHead>
                <TableHead>Physical Progress</TableHead>
                <TableHead>Financial Progress</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Last Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTrackers.map((tracker) => (
                <TableRow key={tracker.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tracker.id}</div>
                      <div className="text-sm text-muted-foreground">{tracker.siteName}</div>
                      <div className="text-xs text-muted-foreground">{tracker.projectSiteId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round((tracker.physicalAccomplishment / tracker.physicalTarget) * 100)}%</span>
                      </div>
                      <Progress
                        value={(tracker.physicalAccomplishment / tracker.physicalTarget) * 100}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        {tracker.physicalAccomplishment}/{tracker.physicalTarget}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">₱{tracker.financialAccomplishment.toLocaleString()}</div>
                      <div className="text-muted-foreground">of ₱{tracker.financialTargets.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((tracker.financialAccomplishment / tracker.financialTargets) * 100)}% completed
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-accent">₱{tracker.balance.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {tracker.dateOfPayout ? new Date(tracker.dateOfPayout).toLocaleDateString() : "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(tracker.status)} flex items-center gap-1`}>
                      {getStatusIcon(tracker.status)}
                      {tracker.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewTracker(tracker)}>
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

      {/* View Tracker Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tracker Details</DialogTitle>
            <DialogDescription>Complete tracking information for {selectedTracker?.siteName}</DialogDescription>
          </DialogHeader>
          {selectedTracker && <TrackerDetailsView tracker={selectedTracker} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddTrackerForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectSiteId">Project Site</Label>
            <Input id="projectSiteId" placeholder="Enter project site ID" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfPayout">Date of Payout</Label>
            <Input id="dateOfPayout" type="date" />
          </div>
        </div>
      </div>

      {/* Targets */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Targets</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="physicalTarget">Physical Target</Label>
            <Input id="physicalTarget" type="number" placeholder="Enter physical target" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="financialTargets">Financial Target</Label>
            <Input id="financialTargets" type="number" placeholder="Enter financial target" />
          </div>
        </div>
      </div>

      {/* Accomplishments */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Accomplishments</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="physicalAccomplishment">Physical Accomplishment</Label>
            <Input id="physicalAccomplishment" type="number" placeholder="Enter accomplishment" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="financialAccomplishment">Financial Accomplishment</Label>
            <Input id="financialAccomplishment" type="number" placeholder="Enter accomplishment" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Remaining Balance</Label>
            <Input id="balance" type="number" placeholder="Enter balance" />
          </div>
        </div>
      </div>

      {/* Program Components */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Program Components</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="socialPreps">Social Preparations</Label>
            <Textarea id="socialPreps" placeholder="Describe social preparation activities..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cftDrrCca">CFT DRR/CCA</Label>
            <Textarea id="cftDrrCca" placeholder="Describe climate resilience training..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfw">Cash for Work (CFW)</Label>
            <Textarea id="cfw" placeholder="Describe cash for work activities..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cftSustainability">CFT Sustainability</Label>
            <Textarea id="cftSustainability" placeholder="Describe sustainability training..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ffw">Food for Work (FFW)</Label>
            <Textarea id="ffw" placeholder="Describe food for work activities..." />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" placeholder="Additional notes and observations..." />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Create Tracker</Button>
      </div>
    </form>
  )
}

function TrackerDetailsView({ tracker }: { tracker: ProjectTrackerRecord }) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="programs">Programs</TabsTrigger>
        <TabsTrigger value="financial">Financial</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Tracker ID</Label>
            <p className="text-sm">{tracker.id}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <Badge className={getStatusColor(tracker.status)}>{tracker.status}</Badge>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Project Site</Label>
          <p className="text-sm">
            {tracker.projectSiteId} - {tracker.siteName}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Physical Progress</Label>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((tracker.physicalAccomplishment / tracker.physicalTarget) * 100)}%</span>
              </div>
              <Progress value={(tracker.physicalAccomplishment / tracker.physicalTarget) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground">
                {tracker.physicalAccomplishment} of {tracker.physicalTarget} completed
              </p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Financial Progress</Label>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((tracker.financialAccomplishment / tracker.financialTargets) * 100)}%</span>
              </div>
              <Progress value={(tracker.financialAccomplishment / tracker.financialTargets) * 100} className="h-3" />
              <p className="text-sm text-muted-foreground">
                ₱{tracker.financialAccomplishment.toLocaleString()} of ₱{tracker.financialTargets.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Remaining Balance</Label>
            <p className="text-2xl font-bold text-accent">₱{tracker.balance.toLocaleString()}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Last Payout Date</Label>
            <p className="text-sm">{tracker.dateOfPayout ? new Date(tracker.dateOfPayout).toLocaleDateString() : "—"}</p>
          </div>
        </div>

        {tracker.remarks && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Remarks</Label>
            <p className="text-sm">{tracker.remarks}</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="programs" className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Social Preparations</Label>
            <p className="text-sm mt-1">{tracker.socialPreps}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">CFT DRR/CCA</Label>
            <p className="text-sm mt-1">{tracker.cftDrrCca}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Cash for Work (CFW)</Label>
            <p className="text-sm mt-1">{tracker.cfw}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">CFT Sustainability</Label>
            <p className="text-sm mt-1">{tracker.cftSustainability}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground">Food for Work (FFW)</Label>
            <p className="text-sm mt-1">{tracker.ffw}</p>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="financial" className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Financial Target</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₱{tracker.financialTargets.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Accomplishment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">₱{tracker.financialAccomplishment.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent">₱{tracker.balance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Financial Utilization Rate</Label>
          <div className="space-y-2 mt-2">
            <Progress value={(tracker.financialAccomplishment / tracker.financialTargets) * 100} className="h-4" />
            <p className="text-sm text-muted-foreground">
              {Math.round((tracker.financialAccomplishment / tracker.financialTargets) * 100)}% of budget utilized
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )

  function getStatusColor(status: string) {
    switch (status) {
      case "On Track":
        return "bg-primary text-primary-foreground"
      case "Completed":
        return "bg-accent text-accent-foreground"
      case "Behind Schedule":
      case "At Risk":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }
}
