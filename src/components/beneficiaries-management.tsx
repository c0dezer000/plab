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
  DialogBody,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Plus, Search, Edit, Eye, UserCheck, DollarSign, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { BeneficiariesManagementRecord, BeneficiariesParticipationStatus } from "@/types/beneficiaries"
import { mapBeneficiaryToManagementRecord } from "@/lib/beneficiary-mappers"

// Accepts input in YYYY-MM-DD or DD/MM/YYYY or loose date strings and returns YYYY-MM-DD or null
function parseToIsoDate(value: unknown): string | null {
  if (!value) return null
  if (typeof value !== 'string') return null
  const v = value.trim()
  if (!v) return null

  // ISO yyyy-mm-dd
  const iso = /^\d{4}-\d{2}-\d{2}$/
  if (iso.test(v)) return v

  // dd/mm/yyyy or d/m/yyyy
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  const m = v.match(dmy)
  if (m) {
    const dd = m[1].padStart(2, '0')
    const mm = m[2].padStart(2, '0')
    const yyyy = m[3]
    return `${yyyy}-${mm}-${dd}`
  }

  // fallback: try Date parser and convert
  const parsed = new Date(v)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().split('T')[0]
}

export type {
  BeneficiariesManagementRecord,
  BeneficiariesParticipationStatus,
} from "@/types/beneficiaries"

interface BeneficiariesManagementProps {
  beneficiaries: BeneficiariesManagementRecord[]
}

const defaultPovertyState = {
  listahanPoor3: false,
  nonListahanPoor3: false,
  fourPsBeneficiary: false,
  withMswdoCertification: false,
}

type PovertyState = {
  listahanPoor3: boolean
  nonListahanPoor3: boolean
  fourPsBeneficiary: boolean
  withMswdoCertification: boolean
}

const defaultCategoryState = {
  farmer: false,
  fisherfolk: false,
  informalSector: false,
  women: false,
  pwd: false,
  elderly: false,
  ips: false,
  soloParent: false,
  youth: false,
  formerRebel: false,
  lgbtqia: false,
}

type CategoryState = {
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
}

type SiteOption = {
  id: string
  siteName: string
  siteType?: string | null
  location: string
}

export function BeneficiariesManagement({ beneficiaries }: BeneficiariesManagementProps) {
  const [beneficiariesState, setBeneficiariesState] = useState<BeneficiariesManagementRecord[]>(beneficiaries)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiariesManagementRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
    const categories: string[] = []
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
    if (beneficiary.fourPsBeneficiary) categories.push("4Ps")
    if (beneficiary.withMswdoCertification) categories.push("With MSWDO Certification")
    if (beneficiary.listahanPoor3) categories.push("Listahan Poor")
    if (beneficiary.nonListahanPoor3) categories.push("Non-Listahan Poor")
    return categories
  }

  const handleViewBeneficiary = (beneficiary: BeneficiariesManagementRecord) => {
    setSelectedBeneficiary(beneficiary)
    setIsViewDialogOpen(true)
  }

  const handleAddBeneficiary = (record: BeneficiariesManagementRecord) => {
    setBeneficiariesState((prev) => [record, ...prev])
    setIsAddDialogOpen(false)
  }

  const totalPayouts = useMemo(
    () => beneficiariesState.reduce((sum, beneficiary) => sum + (beneficiary.payoutAmount ?? 0), 0),
    [beneficiariesState],
  )

  const activeBeneficiaries = useMemo(
    () => beneficiariesState.filter((beneficiary) => beneficiary.participationStatus === "Active").length,
    [beneficiariesState],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">Beneficiaries Management</h2>
          <p className="text-muted-foreground">
            Register beneficiaries, manage their project site enrollments, and monitor participation metrics
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Beneficiary
            </Button>
          </DialogTrigger>
          <DialogContent size="xl" className="max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Add New Beneficiary</DialogTitle>
              <DialogDescription>Register a new beneficiary and link them to project sites</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <AddBeneficiaryForm onClose={() => setIsAddDialogOpen(false)} onAdd={handleAddBeneficiary} />
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search by name or beneficiary ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
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
            <div className="text-2xl font-bold">{beneficiariesState.filter((beneficiary) => beneficiary.fourPsBeneficiary).length}</div>
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
                        <Badge key={`${beneficiary.id}-${category}-${index}`} variant="outline" className="text-xs">
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
                      <div className="text-muted-foreground">
                        {beneficiary.projectSites.length
                          ? beneficiary.projectSites.map((site) => site.siteName).join(", ")
                          : "—"}
                      </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBeneficiary(beneficiary)
                          setIsViewDialogOpen(false)
                          setIsEditDialogOpen(true)
                        }}
                      >
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
        <DialogContent size="lg" className="max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Beneficiary Details</DialogTitle>
            <DialogDescription>Complete information for {selectedBeneficiary?.name}</DialogDescription>
          </DialogHeader>
          {selectedBeneficiary && (
            <DialogBody>
              <BeneficiaryDetailsView beneficiary={selectedBeneficiary} />
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="xl" className="max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Beneficiary</DialogTitle>
            <DialogDescription>Update beneficiary profile and linked projects</DialogDescription>
          </DialogHeader>
          {selectedBeneficiary && (
            <DialogBody>
              <EditBeneficiaryForm
                beneficiary={selectedBeneficiary}
                onSaved={(updated) => {
                  setBeneficiariesState((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
                  setIsEditDialogOpen(false)
                }}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddBeneficiaryForm({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd?: (beneficiary: BeneficiariesManagementRecord) => void
}) {
  const { toast } = useToast()
  const [basicInfo, setBasicInfo] = useState({ name: "", birthday: "", sex: "", payoutAmount: "" })
  const [participationStatus, setParticipationStatus] =
    useState<BeneficiariesParticipationStatus>("Active")
  const [povertyFlags, setPovertyFlags] = useState<PovertyState>({ ...defaultPovertyState })
  const [categoryFlags, setCategoryFlags] = useState<CategoryState>({ ...defaultCategoryState })
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([])
  const [availableSites, setAvailableSites] = useState<SiteOption[]>([])
  const [loadingSites, setLoadingSites] = useState(false)
  const [siteError, setSiteError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const birthdayValue = basicInfo.birthday

  const computedAge = useMemo(() => {
    if (!birthdayValue) return null
    const iso = parseToIsoDate(birthdayValue)
    if (!iso) return null
    const birthDate = new Date(iso)
    if (Number.isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1
    }
    return age >= 0 ? age : null
  }, [birthdayValue])

  useEffect(() => {
    let ignore = false
    setLoadingSites(true)
    fetch("/api/sites")
      .then(async (res) => {
        if (ignore) return
        if (!res.ok) {
          const message = await res.text().catch(() => "Failed to load project sites.")
          throw new Error(message || `Failed to load project sites (${res.status})`)
        }
        const payload = await res.json().catch(() => [])
        if (ignore) return
        if (!Array.isArray(payload) || payload.length === 0) {
          setAvailableSites([])
          setSiteError("No project sites found. Create a project site first.")
          return
        }

        const mapped = (payload as unknown[]).reduce<SiteOption[]>((acc, entry) => {
          const site = entry as Record<string, unknown>
          const id = typeof site?.id === "string" ? site.id : ""
          if (!id) {
            return acc
          }

          const locationParts = [site?.barangay, site?.cityMunicipality, site?.province].filter(
            (part): part is string => typeof part === "string" && part.trim().length > 0,
          )

          acc.push({
            id,
            siteName:
              typeof site?.siteName === "string" && site.siteName.trim().length ? (site.siteName as string) : id,
            siteType:
              typeof site?.siteType === "string" && site.siteType.trim().length ? (site.siteType as string) : null,
            location: locationParts.join(", ") || "",
          })

          return acc
        }, [])

        setAvailableSites(mapped)
      })
      .catch((error) => {
        if (ignore) return
        console.error('Load sites error:', error)
        setSiteError(error?.message || "Failed to load project sites. Please refresh and try again.")
      })
      .finally(() => {
        if (!ignore) setLoadingSites(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const resetForm = () => {
    setBasicInfo({ name: "", birthday: "", sex: "", payoutAmount: "" })
    setParticipationStatus("Active")
    setPovertyFlags({ ...defaultPovertyState })
    setCategoryFlags({ ...defaultCategoryState })
    setSelectedSiteIds([])
    setSiteError(null)
  }

  const handleCancel = () => {
    resetForm()
    onClose()
  }

  const handlePovertyChange = (key: keyof PovertyState) => (checked: boolean | "indeterminate") => {
    setPovertyFlags((prev) => ({ ...prev, [key]: checked === true }))
  }

  const handleCategoryChange = (key: keyof CategoryState) => (checked: boolean | "indeterminate") => {
    setCategoryFlags((prev) => ({ ...prev, [key]: checked === true }))
  }

  const handleRemoveSiteSelection = (siteId: string) => {
    setSelectedSiteIds((prev) => prev.filter((id) => id !== siteId))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

    if (!basicInfo.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter the beneficiary’s full name before saving.",
        variant: "destructive",
      })
      return
    }

    const iso = parseToIsoDate(basicInfo.birthday)
    const birthDate = iso ? new Date(iso) : null
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      toast({
        title: "Invalid birthday",
        description: "Provide a valid birth date to continue.",
        variant: "destructive",
      })
      return
    }

    const today = new Date()
    if (birthDate > today) {
      toast({
        title: "Birthday in the future",
        description: "Birth date cannot be in the future.",
        variant: "destructive",
      })
      return
    }

    if (computedAge === null || computedAge <= 0) {
      toast({
        title: "Unable to compute age",
        description: "Check the birth date entered and try again.",
        variant: "destructive",
      })
      return
    }

    if (!basicInfo.sex) {
      toast({
        title: "Sex required",
        description: "Please select the beneficiary’s sex.",
        variant: "destructive",
      })
      return
    }

    if (basicInfo.payoutAmount) {
      const payout = Number(basicInfo.payoutAmount)
      if (Number.isNaN(payout) || payout < 0) {
        toast({
          title: "Invalid payout",
          description: "Payout amount must be zero or a positive number.",
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    const sexValue = basicInfo.sex === "Male" ? "MALE" : "FEMALE"
    const statusValue =
      participationStatus === "Active"
        ? "ACTIVE"
        : participationStatus === "Pending"
          ? "PENDING"
          : "INACTIVE"

    const body = {
      name: basicInfo.name.trim(),
      age: computedAge,
      sex: sexValue,
      payoutAmount: basicInfo.payoutAmount ? Number(basicInfo.payoutAmount) : undefined,
      participationStatus: statusValue,
      projectSiteIds: selectedSiteIds,
      birthdate: parseToIsoDate(basicInfo.birthday) || undefined,
      ...povertyFlags,
      ...categoryFlags,
    }

    try {
      const response = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      let payload: any = null
      let rawText: string | null = null
      try {
        payload = await response.json()
      } catch (err) {
        rawText = await response.text().catch(() => null)
        payload = rawText ? { error: rawText } : null
      }

      if (!response.ok) {
        const errorMessage =
          (payload && typeof payload === 'object' && 'error' in payload && (payload as any).error) || rawText || response.statusText || `Failed to register beneficiary (status ${response.status})`
        const headers: Record<string, string> = {}
        response.headers.forEach((v, k) => (headers[k] = v))

        const debug = {
          status: response.status,
          statusText: response.statusText,
          headers,
          body: payload ?? rawText,
          requestBody: body,
        }

        // stringify for reliable console output (some consoles show empty objects due to references)
        let debugStr = ''
        try {
          debugStr = JSON.stringify(debug)
        } catch (err) {
          debugStr = String(debug)
        }

        console.error('Beneficiary create failed:', debugStr)
        // also provide structured log for debugging tools that can inspect objects
        console.error('Beneficiary create failed (object):', debug)

        toast({ title: 'Unable to save beneficiary', description: errorMessage, variant: 'destructive' })
        return
      }

      if (!payload || typeof payload !== 'object') {
        console.error('Beneficiary create: empty/invalid JSON payload returned', { rawText })
        toast({ title: 'Unable to save beneficiary', description: 'Server returned an empty response.', variant: 'destructive' })
        return
      }

      const record = mapBeneficiaryToManagementRecord(payload)
      onAdd?.(record)
      toast({
        title: "Beneficiary registered",
        description: `${record.name} has been added successfully.`,
      })
      resetForm()
      onClose()
    } catch (error) {
      console.error(error)
      toast({
        title: "Unexpected error",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving the beneficiary.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold">Beneficiary profile</h3>
          <p className="text-sm text-muted-foreground">
            Capture the beneficiary\u2019s core information and payout details.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="beneficiary-name">Full Name</Label>
            <Input
              id="beneficiary-name"
              value={basicInfo.name}
              onChange={(event) => setBasicInfo((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary-birthday">Birthday</Label>
            <Input
              id="beneficiary-birthday"
              type="date"
              value={basicInfo.birthday}
              max={new Date().toISOString().split("T")[0]}
              onChange={(event) => setBasicInfo((prev) => ({ ...prev, birthday: event.target.value }))}
            />
            {basicInfo.birthday && (
              <p className="text-xs text-muted-foreground">
        {computedAge !== null
          ? `Age: ${computedAge} year${computedAge === 1 ? "" : "s"} old`
          : "We\u2019ll calculate the age once a valid birthday is set."}
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="beneficiary-sex">Sex</Label>
            <Select
              value={basicInfo.sex}
              onValueChange={(value) => setBasicInfo((prev) => ({ ...prev, sex: value }))}
            >
              <SelectTrigger id="beneficiary-sex">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary-payout">Payout Amount (₱)</Label>
            <Input
              id="beneficiary-payout"
              type="number"
              min={0}
              value={basicInfo.payoutAmount}
              onChange={(event) => setBasicInfo((prev) => ({ ...prev, payoutAmount: event.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold">Participation & project sites</h3>
          <p className="text-sm text-muted-foreground">
            Tag socio-economic indicators and link the beneficiary to project sites.
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiary-status">Participation Status</Label>
            <Select
              value={participationStatus}
              onValueChange={(value) => setParticipationStatus(value as BeneficiariesParticipationStatus)}
            >
              <SelectTrigger id="beneficiary-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary-sites">Link to Project Sites</Label>
            <div className="flex flex-col gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Available project sites</div>
                  <div className="rounded-md border bg-muted/20 p-2 max-h-56 overflow-auto">
                    {loadingSites ? (
                      <div className="text-sm text-muted-foreground px-2 py-1">Loading project sites…</div>
                    ) : availableSites.length === 0 ? (
                      <div className="px-2 py-1">
                        <div className="text-sm text-muted-foreground">No project sites available</div>
                        <div className="mt-2">
                          <a className="text-sm text-primary underline" href="/project-sites">
                            Create a project site first
                          </a>
                        </div>
                      </div>
                    ) : (
                      availableSites.map((site) => {
                        const disabled = selectedSiteIds.includes(site.id)
                        return (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => {
                              if (!disabled) {
                                setSelectedSiteIds((prev) => [...prev, site.id])
                              }
                            }}
                            className={`w-full text-left rounded-md border px-3 py-2 mb-2 transition ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-primary'}`}
                          >
                            <div className="font-medium">{site.siteName}</div>
                            <div className="text-xs text-muted-foreground">{site.location || 'Location not set'}</div>
                            {site.siteType && (
                              <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{site.siteType}</div>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Selected project sites</div>
                  <div className="min-h-[6rem] rounded-md border bg-muted/20 px-3 py-2 flex flex-wrap gap-2">
                    {selectedSiteIds.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No project sites linked yet.</span>
                    ) : (
                      selectedSiteIds.map((siteId, index) => {
                        const site = availableSites.find((s) => s.id === siteId)
                        const label = site ? site.siteName : siteId
                        return (
                          <span key={`${siteId}-${index}`} className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                            {label}
                            <button
                              type="button"
                              onClick={() => handleRemoveSiteSelection(siteId)}
                              className="text-muted-foreground transition hover:text-foreground"
                              aria-label={`Remove ${label}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
              {siteError && <p className="text-sm text-destructive">{siteError}</p>}
            </div>
          </div>
        </div>
      </div>
      

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Poverty Status
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={povertyFlags.listahanPoor3}
              onCheckedChange={handlePovertyChange("listahanPoor3")}
            />
            <span>Listahan Poor 3</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={povertyFlags.nonListahanPoor3}
              onCheckedChange={handlePovertyChange("nonListahanPoor3")}
            />
            <span>Non-Listahan Poor 3</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={povertyFlags.fourPsBeneficiary}
              onCheckedChange={handlePovertyChange("fourPsBeneficiary")}
            />
            <span>4Ps Beneficiary</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={povertyFlags.withMswdoCertification}
              onCheckedChange={handlePovertyChange("withMswdoCertification")}
            />
            <span>With MSWDO Certification</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Beneficiary Categories
        </h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.farmer} onCheckedChange={handleCategoryChange("farmer")} />
            <span>Farmer</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryFlags.fisherfolk}
              onCheckedChange={handleCategoryChange("fisherfolk")}
            />
            <span>Fisherfolk</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryFlags.informalSector}
              onCheckedChange={handleCategoryChange("informalSector")}
            />
            <span>Informal Sector</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.women} onCheckedChange={handleCategoryChange("women")} />
            <span>Women</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.pwd} onCheckedChange={handleCategoryChange("pwd")} />
            <span>PWD</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryFlags.elderly}
              onCheckedChange={handleCategoryChange("elderly")}
            />
            <span>Elderly</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.ips} onCheckedChange={handleCategoryChange("ips")} />
            <span>IPs</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryFlags.soloParent}
              onCheckedChange={handleCategoryChange("soloParent")}
            />
            <span>Solo Parent</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.youth} onCheckedChange={handleCategoryChange("youth")} />
            <span>Youth</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryFlags.formerRebel}
              onCheckedChange={handleCategoryChange("formerRebel")}
            />
            <span>Former Rebel</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categoryFlags.lgbtqia}
              onCheckedChange={handleCategoryChange("lgbtqia")}
            />
            <span>LGBTQIA+</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Register Beneficiary"}
        </Button>
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
          {beneficiary.projectSites.map((site, index) => (
            <Badge key={`${site.id}-${index}`} className="bg-primary text-primary-foreground">
              {site.siteName}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditBeneficiaryForm({
  beneficiary,
  onSaved,
  onCancel,
}: {
  beneficiary: BeneficiariesManagementRecord
  onSaved: (b: BeneficiariesManagementRecord) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  // Basic info and form state
  const [basicInfo, setBasicInfo] = useState({
    name: beneficiary.name || "",
    birthday: beneficiary.birthdate ? beneficiary.birthdate : "",
    sex: beneficiary.sex === "Male" ? "Male" : "Female",
    payoutAmount: beneficiary.payoutAmount ? String(beneficiary.payoutAmount) : "",
  })

  const [participationStatus, setParticipationStatus] = useState<BeneficiariesParticipationStatus>(
    beneficiary.participationStatus || "Active",
  )

  const [povertyFlags, setPovertyFlags] = useState<PovertyState>({
    listahanPoor3: !!beneficiary.listahanPoor3,
    nonListahanPoor3: !!beneficiary.nonListahanPoor3,
    fourPsBeneficiary: !!beneficiary.fourPsBeneficiary,
    withMswdoCertification: !!beneficiary.withMswdoCertification,
  })

  const [categoryFlags, setCategoryFlags] = useState<CategoryState>({
    farmer: !!beneficiary.farmer,
    fisherfolk: !!beneficiary.fisherfolk,
    informalSector: !!beneficiary.informalSector,
    women: !!beneficiary.women,
    pwd: !!beneficiary.pwd,
    elderly: !!beneficiary.elderly,
    ips: !!beneficiary.ips,
    soloParent: !!beneficiary.soloParent,
    youth: !!beneficiary.youth,
    formerRebel: !!beneficiary.formerRebel,
    lgbtqia: !!beneficiary.lgbtqia,
  })

  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(
    Array.isArray(beneficiary.projectSites) ? beneficiary.projectSites.map((site) => site.id) : [],
  )
  const [trackerEnrollments, setTrackerEnrollments] = useState<Array<{ trackerId: string; trackerName?: string; stage: string; stageStartedAt?: string }>>([])
  const [availableSites, setAvailableSites] = useState<SiteOption[]>([])
  const [loadingSites, setLoadingSites] = useState(false)
  const [siteError, setSiteError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const computedAge = useMemo(() => {
    if (!basicInfo.birthday) return null
    const iso = parseToIsoDate(basicInfo.birthday)
    if (!iso) return null
    const birthDate = new Date(iso)
    if (Number.isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1
    }
    return age >= 0 ? age : null
  }, [basicInfo.birthday])

  useEffect(() => {
    let ignore = false
    setLoadingSites(true)
    fetch("/api/sites")
      .then(async (res) => {
        if (ignore) return
        if (!res.ok) {
          const message = await res.text().catch(() => "Failed to load project sites.")
          throw new Error(message || `Failed to load project sites (${res.status})`)
        }
        const payload = await res.json().catch(() => [])
        if (ignore) return

        const mapped = (payload as unknown[]).reduce<SiteOption[]>((acc, entry) => {
          const site = entry as Record<string, unknown>
          const id = typeof site?.id === "string" ? site.id : ""
          if (!id) {
            return acc
          }

          const locationParts = [site?.barangay, site?.cityMunicipality, site?.province].filter(
            (part): part is string => typeof part === "string" && part.trim().length > 0,
          )

          acc.push({
            id,
            siteName:
              typeof site?.siteName === "string" && site.siteName.trim().length ? (site.siteName as string) : id,
            siteType:
              typeof site?.siteType === "string" && site.siteType.trim().length ? (site.siteType as string) : null,
            location: locationParts.join(", ") || "",
          })

          return acc
        }, [])

        setAvailableSites(mapped)
      })
      .catch((error) => {
        console.error('Load sites error:', error)
        setSiteError(error?.message || "Failed to load project sites. Please refresh and try again.")
      })
      .finally(() => {
        if (!ignore) setLoadingSites(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false
    // fetch beneficiary full data including tracker enrollments
    ;(async () => {
      try {
        const res = await fetch(`/api/beneficiaries/${encodeURIComponent(beneficiary.id)}`)
        if (!res.ok) return
        const payload = await res.json()
        if (ignore) return
        const enrolls = Array.isArray(payload?.ProjectTrackerBeneficiaryEnrollment) ? payload.ProjectTrackerBeneficiaryEnrollment : []
        const mapped = enrolls.map((en: any) => ({
          trackerId: en.projectTrackerId,
          trackerName: en.ProjectTracker?.projectSite?.siteName || en.ProjectTracker?.projectSiteId || en.projectTrackerId,
          stage: en.stage || 'SOCIAL_PREPS',
          stageStartedAt: en.stageStartedAt || undefined,
        }))
        setTrackerEnrollments(mapped)
      } catch (err) {
        console.debug('Failed to load tracker enrollments for beneficiary edit', err)
      }
    })()

    return () => { ignore = true }
  }, [beneficiary.id])

  const handlePovertyChange = (key: keyof PovertyState) => (checked: boolean | "indeterminate") => {
    setPovertyFlags((prev) => ({ ...prev, [key]: checked === true }))
  }

  const handleCategoryChange = (key: keyof CategoryState) => (checked: boolean | "indeterminate") => {
    setCategoryFlags((prev) => ({ ...prev, [key]: checked === true }))
  }

  const handleRemoveSiteSelection = (siteId: string) => {
    setSelectedSiteIds((prev) => prev.filter((id) => id !== siteId))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (submitting) return
    // validation similar to Add
    if (!basicInfo.name.trim()) {
        toast({
          title: 'Name required',
          description: "Please enter the beneficiary's full name before saving.",
          variant: 'destructive',
        })
      return
    }
    const iso = parseToIsoDate(basicInfo.birthday)
    const birthDate = iso ? new Date(iso) : null
    if (!birthDate || Number.isNaN(birthDate.getTime())) {
      toast({ title: 'Invalid birthday', description: 'Provide a valid birth date to continue.', variant: 'destructive' })
      return
    }
    if (birthDate > new Date()) {
      toast({ title: 'Birthday in the future', description: 'Birth date cannot be in the future.', variant: 'destructive' })
      return
    }
    if (computedAge === null || computedAge <= 0) {
      toast({ title: 'Unable to compute age', description: 'Check the birth date entered and try again.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const sexValue = basicInfo.sex === 'Male' ? 'MALE' : 'FEMALE'
      const statusValue = participationStatus === 'Active' ? 'ACTIVE' : participationStatus === 'Pending' ? 'PENDING' : 'INACTIVE'

  // Ensure birthdate is sent as YYYY-MM-DD (ISO date part) to avoid timezone/parsing issues
  const birthdateIso = parseToIsoDate(basicInfo.birthday) || undefined

      const body: any = {
        name: basicInfo.name.trim(),
        age: computedAge,
        sex: sexValue,
        payoutAmount: basicInfo.payoutAmount ? Number(basicInfo.payoutAmount) : undefined,
        participationStatus: statusValue,
        projectSiteIds: selectedSiteIds,
        birthdate: birthdateIso,
        ...povertyFlags,
        ...categoryFlags,
      }

      // include trackerEnrollments if any changes present
      if (Array.isArray(trackerEnrollments) && trackerEnrollments.length) {
        body.trackerEnrollments = trackerEnrollments.map((t) => ({ trackerId: t.trackerId, stage: t.stage, stageStartedAt: t.stageStartedAt }))
      }

      const path = `/api/beneficiaries/${encodeURIComponent(beneficiary.id)}`
      console.debug('PATCH', path, body)
      const res = await fetch(path, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      let payload: any = null
      let rawText: string | null = null
      try {
        payload = await res.json()
      } catch (err) {
        // if response isn't JSON, capture text for debugging
        rawText = await res.text().catch(() => null)
        payload = rawText ? { error: rawText } : null
      }

      if (!res.ok) {
        // Try to get the raw text for better debugging
        const raw = payload && typeof payload === 'object' && 'error' in payload ? payload.error : null
        const textFallback = raw ?? (await res.text().catch(() => null))
        const message = textFallback || `Failed to update beneficiary (status ${res.status})`
        // Log detailed information for debugging (status, headers snapshot, body)
        const headers: Record<string, string> = {}
        res.headers.forEach((value, key) => (headers[key] = value))
        console.error('Beneficiary update failed', {
          status: res.status,
          headers,
          body: payload ?? textFallback,
          rawText,
          requestBody: body,
        })
        toast({ title: 'Unable to save beneficiary', description: message, variant: 'destructive' })
        return
      }

      // map returned payload to record
  const record = mapBeneficiaryToManagementRecord(payload)
      onSaved(record)
      toast({ title: 'Beneficiary updated', description: `${record.name} has been updated.` })
    } catch (error: any) {
      console.error(error)
      toast({ title: 'Unexpected error', description: error instanceof Error ? error.message : 'Something went wrong while saving the beneficiary.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold">Beneficiary profile</h3>
          <p className="text-sm text-muted-foreground">Edit the beneficiary\u2019s core information and payout details.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="beneficiary-name">Full Name</Label>
            <Input id="beneficiary-name" value={basicInfo.name} onChange={(e) => setBasicInfo((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. Juan Dela Cruz" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary-birthday">Birthday</Label>
            <Input id="beneficiary-birthday" type="date" value={basicInfo.birthday} max={new Date().toISOString().split('T')[0]} onChange={(e) => setBasicInfo((prev) => ({ ...prev, birthday: e.target.value }))} />
            {basicInfo.birthday && (
              <p className="text-xs text-muted-foreground">
                {computedAge !== null ? `Age: ${computedAge} year${computedAge === 1 ? '' : 's'} old` : 'We\u2019ll calculate the age once a valid birthday is set.'}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="beneficiary-sex">Sex</Label>
            <Select value={basicInfo.sex} onValueChange={(value) => setBasicInfo((prev) => ({ ...prev, sex: value }))}>
              <SelectTrigger id="beneficiary-sex">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary-payout">Payout Amount (₱)</Label>
            <Input id="beneficiary-payout" type="number" min={0} value={basicInfo.payoutAmount} onChange={(event) => setBasicInfo((prev) => ({ ...prev, payoutAmount: event.target.value }))} placeholder="Optional" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-base font-semibold">Participation & project sites</h3>
          <p className="text-sm text-muted-foreground">Edit socio-economic indicators and linked project sites.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="beneficiary-status">Participation Status</Label>
            <Select value={participationStatus} onValueChange={(value) => setParticipationStatus(value as BeneficiariesParticipationStatus)}>
              <SelectTrigger id="beneficiary-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="beneficiary-sites">Link to Project Sites</Label>
            <div className="flex flex-col gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Available project sites</div>
                  <div className="rounded-md border bg-muted/20 p-2 max-h-56 overflow-auto">
                    {loadingSites ? (
                      <div className="text-sm text-muted-foreground px-2 py-1">Loading project sites…</div>
                    ) : availableSites.length === 0 ? (
                      <div className="px-2 py-1">
                        <div className="text-sm text-muted-foreground">No project sites available</div>
                        <div className="mt-2">
                          <a className="text-sm text-primary underline" href="/project-sites">
                            Create a project site first
                          </a>
                        </div>
                      </div>
                    ) : (
                      availableSites.map((site) => {
                        const disabled = selectedSiteIds.includes(site.id)
                        return (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => {
                              if (!disabled) {
                                setSelectedSiteIds((prev) => [...prev, site.id])
                              }
                            }}
                            className={`w-full text-left rounded-md border px-3 py-2 mb-2 transition ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-primary'}`}
                          >
                            <div className="font-medium">{site.siteName}</div>
                            <div className="text-xs text-muted-foreground">{site.location || 'Location not set'}</div>
                            {site.siteType && (
                              <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{site.siteType}</div>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Selected project sites</div>
                  <div className="min-h-[6rem] rounded-md border bg-muted/20 px-3 py-2 flex flex-wrap gap-2">
                    {selectedSiteIds.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No project sites linked yet.</span>
                    ) : (
                      selectedSiteIds.map((siteId, index) => {
                        const site = availableSites.find((s) => s.id === siteId)
                        const label = site ? site.siteName : siteId
                        return (
                          <span key={`${siteId}-${index}`} className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs font-medium">
                            {label}
                            <button type="button" onClick={() => handleRemoveSiteSelection(siteId)} className="text-muted-foreground transition hover:text-foreground" aria-label={`Remove ${label}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
              {siteError && <p className="text-sm text-destructive">{siteError}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Poverty Status</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={povertyFlags.listahanPoor3} onCheckedChange={handlePovertyChange('listahanPoor3')} />
            <span>Listahan Poor 3</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={povertyFlags.nonListahanPoor3} onCheckedChange={handlePovertyChange('nonListahanPoor3')} />
            <span>Non-Listahan Poor 3</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={povertyFlags.fourPsBeneficiary} onCheckedChange={handlePovertyChange('fourPsBeneficiary')} />
            <span>4Ps Beneficiary</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={povertyFlags.withMswdoCertification} onCheckedChange={handlePovertyChange('withMswdoCertification')} />
            <span>With MSWDO Certification</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Beneficiary Categories</h4>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.farmer} onCheckedChange={handleCategoryChange('farmer')} />
            <span>Farmer</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.fisherfolk} onCheckedChange={handleCategoryChange('fisherfolk')} />
            <span>Fisherfolk</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.informalSector} onCheckedChange={handleCategoryChange('informalSector')} />
            <span>Informal Sector</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.women} onCheckedChange={handleCategoryChange('women')} />
            <span>Women</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.pwd} onCheckedChange={handleCategoryChange('pwd')} />
            <span>PWD</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.elderly} onCheckedChange={handleCategoryChange('elderly')} />
            <span>Elderly</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.ips} onCheckedChange={handleCategoryChange('ips')} />
            <span>IPs</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.soloParent} onCheckedChange={handleCategoryChange('soloParent')} />
            <span>Solo Parent</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.youth} onCheckedChange={handleCategoryChange('youth')} />
            <span>Youth</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.formerRebel} onCheckedChange={handleCategoryChange('formerRebel')} />
            <span>Former Rebel</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={categoryFlags.lgbtqia} onCheckedChange={handleCategoryChange('lgbtqia')} />
            <span>LGBTQIA+</span>
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save changes'}</Button>
      </div>
    </form>
  )
}
