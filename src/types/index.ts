export type FieldType =
  | 'welcome'
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'date'
  | 'url'
  | 'cpf'
  | 'cnpj'
  | 'identity_doc'
  | 'full_name'
  | 'address'
  | 'multiple_choice'
  | 'checkbox'
  | 'image_selection'
  | 'dropdown'
  | 'satisfaction_scale'
  | 'terms'
  | 'thanks'
  | 'message'
  | 'file_upload'

export interface FormFieldOption {
  id: string
  label: string
  value: string
  imageUrl?: string
  points?: number
  hasTextInput?: boolean
  textInputPlaceholder?: string
}

export interface FormFieldSettings {
  maxLength?: number
  minValue?: number
  maxValue?: number
  allowDecimals?: boolean
  currency?: string
  dateFormat?: string
  minDate?: string
  maxDate?: string
  requireWorkEmail?: boolean
  options?: FormFieldOption[]
  minSelections?: number
  maxSelections?: number
  columns?: 1 | 2
  allowOther?: boolean
  scaleMin?: number
  scaleMax?: number
  scaleMinLabel?: string
  scaleMaxLabel?: string
  scaleIcon?: 'numbers' | 'stars' | 'hearts' | 'emojis'
  termsText?: string
  // Thanks field settings
  thanksType?: 'message' | 'redirect' | 'download' | 'checkout'
  redirectUrl?: string
  redirectDelay?: number
  passUtms?: boolean
  downloadFileUrl?: string
  checkoutUrl?: string
  buttonText?: string
  // File upload
  maxFileSize?: number // in MB
  allowedFileTypes?: string[]
}

export interface FieldMedia {
  type: 'image' | 'video'
  url: string
  position: 'top' | 'side' | 'hero'
}

export interface ConditionalLogic {
  rules: ConditionalRule[]
}

export interface ConditionalRule {
  condition: ConditionalOperator
  value: string
  targetFieldId: string
}

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'any_value'
  | 'no_value'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'date_equals'
  | 'date_before'
  | 'date_after'

export interface FormAppearance {
  logoUrl?: string
  backgroundImageUrl?: string
  backgroundColor?: string
  primaryColor?: string
  textColor?: string
  fontFamily?: string
  borderRadius?: number
  borderStyle?: 'rounded' | 'square' | 'pill'
  removeBranding?: boolean
  progressBar?: 'bar' | 'steps' | 'hidden'
}

export interface FormSettings {
  appearance: FormAppearance
  seo: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
  }
  tracking: {
    pixelId?: string
    gaId?: string
    gtmId?: string
    utmEnabled?: boolean
  }
  notifications: {
    ownerEmail?: boolean
    respondentCopy?: boolean
    forwardEmails?: string[]
    notifyPartial?: boolean
  }
  customDomain?: string
  language?: 'pt-BR' | 'en' | 'es'
  blockedMessage?: string
  embedSettings?: {
    type: 'fullpage' | 'popup' | 'widget'
  }
}

export interface FormWithFields {
  id: string
  userId: string
  teamId?: string | null
  name: string
  slug: string
  status: 'draft' | 'published' | 'blocked'
  settings: FormSettings
  fields: FormFieldData[]
  createdAt: string
  updatedAt: string
}

export interface FormFieldData {
  id: string
  formId: string
  type: FieldType
  order: number
  title: string
  description?: string | null
  required: boolean
  placeholder?: string | null
  settings: FormFieldSettings
  media?: FieldMedia | null
  logic?: ConditionalLogic | null
  conversionEvent: boolean
}

// Plan limits
export const PLAN_LIMITS = {
  free: { responsesPerMonth: 100, maxForms: 3, storageMb: 100 },
  solo: { responsesPerMonth: 1000, maxForms: Infinity, storageMb: 1024 },
  pro: { responsesPerMonth: 5000, maxForms: Infinity, storageMb: 5120 },
  empresa: { responsesPerMonth: 15000, maxForms: Infinity, storageMb: 10240 },
} as const
