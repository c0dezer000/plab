"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Users, Plus, Search, Edit, Eye, UserCheck, DollarSign } from "lucide-react"

export type BeneficiariesParticipationStatus = "Active" | "Inactive" | "Pending"

export interface BeneficiariesManagementRecord {
  id: string
  name: string
  age: number
  sex: "Male" | "Female"
  listahanPoor3: boolean
  nonListahanPoor3: boolean
  fourPsBeneficiary: boolean
  withMswdoCertification: boolean
  farmer: boolean
  fisherfolk: boolean
  informalSector: boolean
  women: boolean
  pwd: boolean
  elderly: boolean
  ips: boolean
  soloParent: boolean
  youth: boolean
  formerRebel: boolean
  lgbtqia: boolean
  payoutAmount: number
  participationStatus: BeneficiariesParticipationStatus
  projectSites: string[]
  dateLinked: string | null
}

interface BeneficiariesManagementProps {
  beneficiaries: BeneficiariesManagementRecord[]
}

export function BeneficiariesManagement({ beneficiaries }: BeneficiariesManagementProps) {
  const [beneficiariesState, setBeneficiariesState] = useState<BeneficiariesManagementRecord[]>(beneficiaries)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiariesManagementRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    setBeneficiariesState(beneficiaries)
  }, [beneficiaries])

  const filteredBeneficiaries = useMemo(
    () =>
      beneficiariesState.filter((beneficiary) => {
        const matchesSearch =
          beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          beneficiary.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus =
          statusFilter === "all" || beneficiary.participationStatus.toLowerCase() === statusFilter
        return matchesSearch && matchesStatus
      }),
    [beneficiariesState, searchTerm, statusFilter],
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-primary text-primary-foreground"
      case "Pending":
        return "bg-accent text-accent-foreground"
      case "Inactive":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getBeneficiaryCategories = (beneficiary: BeneficiariesManagementRecord) => {
    const categories = []
    if (beneficiary.farmer) categories.push("Farmer")
    if (beneficiary.fisherfolk) categories.push("Fisherfolk")
    if (beneficiary.women) categories.push("Women")
    if (beneficiary.elderly) categories.push("Elderly")
    if (beneficiary.pwd) categories.push("PWD")
    if (beneficiary.soloParent) categories.push("Solo Parent")
    if (beneficiary.youth) categories.push("Youth")
  if (beneficiary.fourPsBeneficiary) categories.push("4Ps")
    return categories.slice(0, 3) // Show only first 3 categories
  }

  const handleViewBeneficiary = (beneficiary: BeneficiariesManagementRecord) => {
    setSelectedBeneficiary(beneficiary)
    setIsViewDialogOpen(true)
  }

  const totalPayouts = beneficiariesState.reduce((sum, b) => sum + b.payoutAmount, 0)
  const activeBeneficiaries = beneficiariesState.filter((b) => b.participationStatus === "Active").length

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Beneficiaries Management</h2>
          <p className="text-muted-foreground">Register and manage project beneficiaries</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Beneficiary</DialogTitle>
              <DialogDescription>Register a new beneficiary for project participation</DialogDescription>
            </DialogHeader>
            <AddBeneficiaryForm onClose={() => setIsAddDialogOpen(false)} />
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
                placeholder="Search by name or beneficiary ID..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiaries Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{beneficiariesState.length}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBeneficiaries}</div>
            <p className="text-xs text-muted-foreground">Currently participating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Distributed to beneficiaries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">4Ps Beneficiaries</CardTitle>
            <Users className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{beneficiariesState.filter((b) => b.fourPsBeneficiary).length}</div>
            <p className="text-xs text-muted-foreground">Government program participants</p>
          </CardContent>
        </Card>
      </div>

      {/* Beneficiaries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficiaries Directory</CardTitle>
          <CardDescription>
            Complete list of all registered beneficiaries with their participation details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiary Info</TableHead>
                <TableHead>Demographics</TableHead>
                <TableHead>Categories</TableHead>
                <TableHead>Project Sites</TableHead>
                <TableHead>Payout Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiaries.map((beneficiary) => (
                <TableRow key={beneficiary.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{beneficiary.name}</div>
                      <div className="text-sm text-muted-foreground">ID: {beneficiary.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        {beneficiary.sex}, {beneficiary.age} years old
                      </div>
                      <div className="text-muted-foreground">
                        {beneficiary.listahanPoor3 && "Listahan Poor"}
                        {beneficiary.nonListahanPoor3 && "Non-Listahan Poor"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getBeneficiaryCategories(beneficiary).map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {getBeneficiaryCategories(beneficiary).length === 0 && (
                        <span className="text-xs text-muted-foreground">No categories</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {beneficiary.projectSites.length} site{beneficiary.projectSites.length !== 1 ? "s" : ""}
                      <div className="text-muted-foreground">{beneficiary.projectSites.join(", ")}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">₱{beneficiary.payoutAmount.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(beneficiary.participationStatus)}>
                      {beneficiary.participationStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewBeneficiary(beneficiary)}>
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

      {/* View Beneficiary Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Beneficiary Details</DialogTitle>
            <DialogDescription>Complete information for {selectedBeneficiary?.name}</DialogDescription>
          </DialogHeader>
          {selectedBeneficiary && <BeneficiaryDetailsView beneficiary={selectedBeneficiary} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddBeneficiaryForm({ onClose }: { onClose: () => void }) {
  return (
    <form className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Enter full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" placeholder="Enter age" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sex">Sex</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payoutAmount">Payout Amount</Label>
            <Input id="payoutAmount" type="number" placeholder="Enter amount" />
          </div>
        </div>
      </div>

      {/* Poverty Status */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Poverty Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="listahanPoor3" />
            <Label htmlFor="listahanPoor3">Listahan Poor 3</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="nonListahanPoor3" />
            <Label htmlFor="nonListahanPoor3">Non-Listahan Poor 3</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="_4psBeneficiary" />
            <Label htmlFor="_4psBeneficiary">4Ps Beneficiary</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="withMswdoCertification" />
            <Label htmlFor="withMswdoCertification">With MSWDO Certification</Label>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Beneficiary Categories</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="farmer" />
            <Label htmlFor="farmer">Farmer</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="fisherfolk" />
            <Label htmlFor="fisherfolk">Fisherfolk</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="informalSector" />
            <Label htmlFor="informalSector">Informal Sector</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="women" />
            <Label htmlFor="women">Women</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="pwd" />
            <Label htmlFor="pwd">PWD</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="elderly" />
            <Label htmlFor="elderly">Elderly</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="ips" />
            <Label htmlFor="ips">IPs</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="soloParent" />
            <Label htmlFor="soloParent">Solo Parent</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="youth" />
            <Label htmlFor="youth">Youth</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="formerRebel" />
            <Label htmlFor="formerRebel">Former Rebel</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="lgbtqia" />
            <Label htmlFor="lgbtqia">LGBTQIA+</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onClose}>Register Beneficiary</Button>
      </div>
    </form>
  )
}

function BeneficiaryDetailsView({ beneficiary }: { beneficiary: BeneficiariesManagementRecord }) {
  const getAllCategories = (beneficiary: BeneficiariesManagementRecord) => {
    const categories = []
    if (beneficiary.farmer) categories.push("Farmer")
    if (beneficiary.fisherfolk) categories.push("Fisherfolk")
    if (beneficiary.informalSector) categories.push("Informal Sector")
    if (beneficiary.women) categories.push("Women")
    if (beneficiary.pwd) categories.push("PWD")
    if (beneficiary.elderly) categories.push("Elderly")
    if (beneficiary.ips) categories.push("IPs")
    if (beneficiary.soloParent) categories.push("Solo Parent")
    if (beneficiary.youth) categories.push("Youth")
    if (beneficiary.formerRebel) categories.push("Former Rebel")
    if (beneficiary.lgbtqia) categories.push("LGBTQIA+")
    return categories
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Beneficiary ID</Label>
          <p className="text-sm">{beneficiary.id}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Participation Status</Label>
          <Badge
            className={`${beneficiary.participationStatus === "Active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} mt-1`}
          >
            {beneficiary.participationStatus}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Age</Label>
          <p className="text-sm">{beneficiary.age} years old</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Sex</Label>
          <p className="text-sm">{beneficiary.sex}</p>
        </div>
      </div>

      {/* Poverty Status */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Poverty Status</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {beneficiary.listahanPoor3 && <Badge variant="outline">Listahan Poor 3</Badge>}
          {beneficiary.nonListahanPoor3 && <Badge variant="outline">Non-Listahan Poor 3</Badge>}
          {beneficiary.fourPsBeneficiary && <Badge variant="outline">4Ps Beneficiary</Badge>}
          {beneficiary.withMswdoCertification && <Badge variant="outline">MSWDO Certified</Badge>}
        </div>
      </div>

      {/* Categories */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Beneficiary Categories</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {getAllCategories(beneficiary).map((category, index) => (
            <Badge key={index} variant="outline">
              {category}
            </Badge>
          ))}
          {getAllCategories(beneficiary).length === 0 && (
            <p className="text-sm text-muted-foreground">No categories assigned</p>
          )}
        </div>
      </div>

      {/* Financial Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Payout Amount</Label>
          <p className="text-2xl font-bold text-accent">₱{beneficiary.payoutAmount.toLocaleString()}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Date Linked</Label>
          <p className="text-sm">
            {beneficiary.dateLinked ? new Date(beneficiary.dateLinked).toLocaleDateString() : "—"}
          </p>
        </div>
      </div>

      {/* Project Sites */}
      <div>
        <Label className="text-sm font-medium text-muted-foreground">Linked Project Sites</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {beneficiary.projectSites.map((siteId, index) => (
            <Badge key={index} className="bg-primary text-primary-foreground">
              {siteId}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
