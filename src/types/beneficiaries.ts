export type BeneficiariesParticipationStatus = "Active" | "Inactive" | "Pending"

export interface BeneficiaryProjectSiteSummary {
  id: string
  siteName: string
}

export interface BeneficiariesManagementRecord {
  id: string
  name: string
  age: number
  birthdate?: string | null
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
  projectSites: BeneficiaryProjectSiteSummary[]
  dateLinked: string | null
}
