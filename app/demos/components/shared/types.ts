export interface ProductConfig {
  id: string
  name: string
  shortName: string
  workspaceOrg: string
  accent: 'cyan' | 'orange' | 'violet' | 'emerald' | 'amber' | 'rose'
  statusLabel: string
  statusDescription: string
  ctaText: string
  completionHeading: string
  completionAccomplishments: string[]
  completionOutcome: string
  completionCtaText: string
  enquiryHeading: string
  enquiryImagination: string
  enquiryModules: string[]
  enquirySource: string
  demoNoticeExtras: string[]
  tourSteps: TourStepData[]
  bgBase: string
  bgHeader: string
  borderColor: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  accentText: string
  accentBg: string
  accentBorder: string
  ctaBg: string
  ctaHoverBg: string
  ctaTextColor: string
  buttonHoverBg: string
  iconColor: string
}

export interface TourStepData {
  view?: string
  title: string
  instruction: string
}

export interface GuidedTourState {
  active: boolean
  step: number
}

export interface DemoControlBarProps {
  product: ProductConfig
  onStartTour: () => void
  onReset: () => void
  onBuildCTA: () => void
  tourActive: boolean
  onToggleSidebar?: () => void
  onSwitchExperience?: () => void
  extraLeftContent?: React.ReactNode
  extraRightContent?: React.ReactNode
}