export type Role =
  | "owner"
  | "verified_manager"
  | "unverified_manager"
  | "admin";

export type ManagerBasket = "premium" | "open";

export type AustralianState =
  | "QLD"
  | "NSW"
  | "VIC"
  | "WA"
  | "SA"
  | "TAS"
  | "NT"
  | "ACT";

export type RightToWork =
  | "Australian Citizen"
  | "Permanent Resident"
  | "Visa with unrestricted work rights"
  | "Visa with restricted work rights";

export type ExperienceBand =
  | "Less than 1 year"
  | "1-2 years"
  | "3-5 years"
  | "5+ years";

export type ProfileType = "Solo" | "Couple";

export type JobType =
  | "Full-Time"
  | "Relief"
  | "Relief Couple"
  | "Permanent Couple";

export type ReferenceStatus = "Pending" | "Verified" | "Failed";

export type ContractStatus =
  | "Proposal"
  | "NDAPending"
  | "ChatActive"
  | "Agreed"
  | "Completed"
  | "Declined";

export type AdvisorCategory =
  | "Motel Broker"
  | "Lawyer & Legal"
  | "Accountant & Tax"
  | "Finance & Refinancing";

export type AdvisorService =
  | "Buying"
  | "Selling"
  | "Lease"
  | "Legal"
  | "Tax"
  | "Refinancing"
  | "General";

export type SoftwareCategory = "PMS" | "POS" | "HR";

export type OfficeSuite = {
  Word: boolean;
  Excel: boolean;
  Outlook: boolean;
  Teams: boolean;
};

export type Reference = {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: ReferenceStatus;
};

export type ManagerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  state: AustralianState;
  lat: number;
  lng: number;
  photoUrl: string;
  bio: string;
  rightToWork: RightToWork;
  experience: ExperienceBand;
  profileType: ProfileType;
  partnerName?: string;
  partnerBio?: string;
  partnerExperience?: ExperienceBand;
  partnerPhotoUrl?: string;
  partnerRightToWork?: RightToWork;
  preferredLocations: Array<AustralianState | "Nationwide">;
  preferredJobTypes: JobType[];
  liquorLicensing: boolean;
  liquorStates: AustralianState[];
  eventsExperience: boolean;
  restaurantPubExperience: boolean;
  microsoftOffice: OfficeSuite;
  softwarePMS: string[];
  softwarePOS: string[];
  softwareHR: string[];
  compliance: {
    policeCheck: boolean;
    referenceList: boolean;
    managerLicense: boolean;
  };
  references: Reference[];
  isVerified: boolean;
  verifiedByAdmin?: boolean;
  blockoutDates: string[];
  completedShifts: number;
};

export type OwnerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  motelName: string;
  location: string;
  state: AustralianState;
  photoUrl: string;
  rooms: number;
  pms: string;
  advisoryStack: string[];
  advisoryPromptDismissed: boolean;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  sender: string;
  text: string;
  timestamp: string;
};

export type OwnerReview = {
  overall: number;
  guestService: number;
  computerCapability: number;
  attentionToDetail: number;
  rehire: boolean;
  comments: string;
};

export type ManagerReview = {
  residence: number;
  environment: number;
  wagesPaidSwiftly: number;
  comments: string;
};

export type ListedRoleStatus = "Open" | "Filled" | "Closed";

export type RoleProfilePreference = ProfileType | "Either";
export type OccupancyMix = "Corporate" | "Leisure" | "Mixed" | "";
export type EmploymentType = "Contractor" | "Employee";
export type YesNoUnknown = "Yes" | "No" | "Unknown" | "";

export type RoleBrief = {
  contactName: string;
  contactPhone: string;
  profileType: RoleProfilePreference;
  rooms: number;
  pms: string[];
  pos: string[];
  hr: string[];
  otherSystems: string;
  durationNotes: string;
  liquorRequired: boolean;
  liquorNotes: string;
  safeFoodLicense: boolean;
  eventsRequired: boolean;
  restaurantRequired: boolean;
  occupancyAverage: string;
  occupancyNotes: string;
  occupancyMix: OccupancyMix;
  gdsConnected: YesNoUnknown;
  cleaningExpectation: string;
  employmentType: EmploymentType;
  rosterNotes: string;
  livingQuarters: string;
  petsAllowed: boolean;
  mealPrepNotes: string;
  superIncluded: boolean;
  accommodationIncluded: boolean;
  billsIncluded: boolean;
  mealsIncluded: boolean;
  packageNotes: string;
};

export type ListedRole = {
  id: string;
  ownerId: string;
  ownerName: string;
  motelName: string;
  location: string;
  state: AustralianState;
  jobType: JobType;
  startDate: string;
  endDate: string;
  dailyRate: number;
  notes: string;
  brief?: RoleBrief;
  status: ListedRoleStatus;
  interestedManagerIds: string[];
  createdAt: string;
};

export type JobContract = {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerMotel: string;
  managerId: string;
  managerName: string;
  startDate: string;
  endDate: string;
  dailyRate: number;
  contractDetails: string;
  specialConditions: string;
  status: ContractStatus;
  ownerSignedNDA: boolean;
  managerSignedNDA: boolean;
  ownerAgreed: boolean;
  managerAgreed: boolean;
  messages: ChatMessage[];
  reviewByOwner?: OwnerReview;
  reviewByManager?: ManagerReview;
  disputed: boolean;
  disputeNote?: string;
  disputeStatus?: "Open" | "Resolved" | "Dismissed";
};

export type AdvisorProfile = {
  id: string;
  name: string;
  practiceName: string;
  category: AdvisorCategory;
  statesCovered: AustralianState[];
  location: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  website: string;
  specialtyTags: string[];
  photoUrl: string;
  bio: string;
};

export type AdvisorReview = {
  id: string;
  advisorId: string;
  ownerId: string;
  ownerName: string;
  ownerMotel: string;
  region: AustralianState;
  serviceProvided: AdvisorService;
  rating: number;
  feedback: string;
  date: string;
  isVerifiedOwner: boolean;
};

export type CustomSoftwareRequest = {
  id: string;
  name: string;
  category: SoftwareCategory;
  submittedBy: string;
  status: "Pending" | "Approved" | "Merged";
};

export type SoftwareTaxonomy = {
  pms: string[];
  pos: string[];
  hr: string[];
  customQueue: CustomSoftwareRequest[];
};

export type WaitlistEntry = {
  id: string;
  email: string;
  interest: "owner" | "manager";
  createdAt: string;
  inviteCode: string;
  referredBy?: string;
  admitted?: boolean;
};

export type ManagerRosterRecord = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  location: string | null;
  state: string | null;
  basket: ManagerBasket;
  verifiedByAdmin: boolean;
  createdAt: string;
  profile?: Partial<ManagerProfile> | null;
};

export type ListedRoleRecord = {
  id: string;
  ownerEmail: string;
  ownerName: string;
  motelName: string;
  location: string;
  state: string;
  jobType: JobType;
  startDate: string;
  endDate: string;
  dailyRate: number;
  notes: string;
  brief?: RoleBrief | null;
  status: ListedRoleStatus;
  interestedEmails: string[];
  createdAt: string;
};

export type PublicManagerProfile = {
  id: string;
  name: string;
  location: string;
  state: AustralianState;
  photoUrl: string;
  bio: string;
  rightToWork: RightToWork;
  experience: ExperienceBand;
  profileType: ProfileType;
  partnerName?: string;
  partnerBio?: string;
  partnerExperience?: ExperienceBand;
  partnerPhotoUrl?: string;
  preferredLocations: Array<AustralianState | "Nationwide">;
  preferredJobTypes: JobType[];
  liquorLicensing: boolean;
  liquorStates: AustralianState[];
  eventsExperience: boolean;
  restaurantPubExperience: boolean;
  softwarePMS: string[];
  softwarePOS: string[];
  softwareHR: string[];
  isVerified: boolean;
  completedShifts: number;
};

export type LoginAccount = {
  role: Role;
  email: string;
  name: string;
  label: string;
  photoUrl: string;
  ownerId?: string;
  managerId?: string;
  personaId?: string;
  motelName?: string;
};

export type Persona = {
  id: string;
  role: Role;
  label: string;
  name: string;
  subtitle: string;
  photoUrl: string;
  ownerId?: string;
  managerId?: string;
};

export type Session = {
  personaId?: string;
  role: Role;
  ownerId?: string;
  managerId?: string;
  email: string;
  name: string;
  photoUrl: string;
  label: string;
};

export type AppState = {
  managers: ManagerProfile[];
  owners: OwnerProfile[];
  contracts: JobContract[];
  listedRoles: ListedRole[];
  advisors: AdvisorProfile[];
  advisorReviews: AdvisorReview[];
  taxonomy: SoftwareTaxonomy;
  waitlist: WaitlistEntry[];
  session: Session | null;
};

export const AU_STATES: AustralianState[] = [
  "QLD",
  "NSW",
  "VIC",
  "WA",
  "SA",
  "TAS",
  "NT",
  "ACT",
];

export const JOB_TYPES: JobType[] = [
  "Full-Time",
  "Relief",
  "Relief Couple",
  "Permanent Couple",
];

export const EXPERIENCE_BANDS: ExperienceBand[] = [
  "Less than 1 year",
  "1-2 years",
  "3-5 years",
  "5+ years",
];

export const WORK_RIGHTS: RightToWork[] = [
  "Australian Citizen",
  "Permanent Resident",
  "Visa with unrestricted work rights",
  "Visa with restricted work rights",
];

export const ADVISOR_CATEGORIES: AdvisorCategory[] = [
  "Motel Broker",
  "Lawyer & Legal",
  "Accountant & Tax",
  "Finance & Refinancing",
];

export const ADVISOR_SERVICES: AdvisorService[] = [
  "Buying",
  "Selling",
  "Lease",
  "Legal",
  "Tax",
  "Refinancing",
  "General",
];

export const CONTRACT_STAGES: ContractStatus[] = [
  "Proposal",
  "NDAPending",
  "ChatActive",
  "Agreed",
  "Completed",
];
