"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, MapPin, Droplets, Sprout, FileText, Plus } from "lucide-react"
import { ProjectsManagement, ProjectsManagementBinhiProject, ProjectsManagementLawaProject } from "@/components/projects-management"
import { BeneficiariesManagement, BeneficiariesManagementRecord } from "@/components/beneficiaries-management"
import { ProjectTracking, ProjectTrackerRecord } from "@/components/project-tracking"

interface ProjectDistributionDatum {
  name: string
  value: number
  color: string
  [key: string]: string | number
}

interface MonthlyProgressDatum {
  month: string
  lawa: number
  binhi: number
  [key: string]: string | number
}

interface RecentActivityItem {
  id: string
  title: string
  description: string
  timeLabel: string
  type: "lawa" | "binhi" | "beneficiary" | "report"
}

interface DashboardMetrics {
  totalProjects: number
  activeBeneficiaries: number
  totalLawaProjects: number
  totalBinhiProjects: number
}

interface DashboardClientProps {
  metrics: DashboardMetrics
  projectDistribution: ProjectDistributionDatum[]
  monthlyProgress: MonthlyProgressDatum[]
  recentActivity: RecentActivityItem[]
  lawaProjects: ProjectsManagementLawaProject[]
  binhiProjects: ProjectsManagementBinhiProject[]
  // site props removed
  beneficiaries: BeneficiariesManagementRecord[]
  trackers: ProjectTrackerRecord[]
}

export function DashboardClient({
  metrics,
  projectDistribution,
  monthlyProgress,
  recentActivity,
  lawaProjects,
  binhiProjects,
  // site props removed
  beneficiaries,
  trackers,
}: DashboardClientProps) {
  const nonEmptyProjectDistribution = useMemo(() => {
    if (projectDistribution.length === 0) {
      return [
        { name: "Lawa Projects", value: 0, color: "#059669" },
        { name: "Binhi Projects", value: 0, color: "#10b981" },
      ]
    }

    return projectDistribution
  }, [projectDistribution])

  const nonEmptyMonthlyProgress = useMemo(() => {
    if (monthlyProgress.length === 0) {
      return [
        { month: "Jan", lawa: 0, binhi: 0 },
        { month: "Feb", lawa: 0, binhi: 0 },
        { month: "Mar", lawa: 0, binhi: 0 },
        { month: "Apr", lawa: 0, binhi: 0 },
        { month: "May", lawa: 0, binhi: 0 },
        { month: "Jun", lawa: 0, binhi: 0 },
      ]
    }

    return monthlyProgress
  }, [monthlyProgress])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Project Management Dashboard</h1>
              <p className="text-muted-foreground">Lawa &amp; Binhi Projects Monitoring System</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProjects}</div>
              <p className="text-xs text-muted-foreground">Across all project sites</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Beneficiaries</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeBeneficiaries}</div>
              <p className="text-xs text-muted-foreground">Currently participating in projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lawa Projects</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalLawaProjects}</div>
              <p className="text-xs text-muted-foreground">Water-related initiatives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Binhi Projects</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBinhiProjects}</div>
              <p className="text-xs text-muted-foreground">Agriculture &amp; planting initiatives</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="beneficiaries">Beneficiaries</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Distribution</CardTitle>
                  <CardDescription>Current breakdown of Lawa vs Binhi projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      lawa: {
                        label: "Lawa Projects",
                        color: "hsl(var(--chart-1))",
                      },
                      binhi: {
                        label: "Binhi Projects",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={nonEmptyProjectDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${String(name)} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {nonEmptyProjectDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Progress</CardTitle>
                  <CardDescription>Project accomplishments by month and type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      lawa: {
                        label: "Lawa Projects",
                        color: "hsl(var(--chart-1))",
                      },
                      binhi: {
                        label: "Binhi Projects",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nonEmptyMonthlyProgress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="lawa" fill="var(--color-lawa)" />
                        <Bar dataKey="binhi" fill="var(--color-binhi)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across all projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/50">
                      <div className="flex-shrink-0">
                        {activity.type === "lawa" && <Droplets className="h-5 w-5 text-chart-1" />}
                        {activity.type === "binhi" && <Sprout className="h-5 w-5 text-chart-2" />}
                        {activity.type === "beneficiary" && <Users className="h-5 w-5 text-accent" />}
                        {activity.type === "report" && <FileText className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{activity.timeLabel}</p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsManagement lawaProjects={lawaProjects} binhiProjects={binhiProjects} projectSites={[]} />
          </TabsContent>

          <TabsContent value="beneficiaries">
            <BeneficiariesManagement beneficiaries={beneficiaries} />
          </TabsContent>

          <TabsContent value="tracking">
            <ProjectTracking trackers={trackers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
