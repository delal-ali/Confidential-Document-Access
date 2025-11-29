export type SecurityLabel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET'
export type Classification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL'

export interface SecurityClearance {
  label: SecurityLabel
  level: number
}

// Security label hierarchy (higher number = more sensitive)
export const SECURITY_LABELS: Record<SecurityLabel, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  TOP_SECRET: 3,
}

// Classification hierarchy
export const CLASSIFICATIONS: Record<Classification, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
}

/**
 * MAC: Check if user has sufficient clearance to access resource
 */
export function checkMACAccess(
  userClearance: SecurityLabel,
  userLevel: number,
  resourceLabel: SecurityLabel,
  resourceClassification: Classification
): boolean {
  const userLabelLevel = SECURITY_LABELS[userClearance as SecurityLabel]
  const resourceLabelLevel = SECURITY_LABELS[resourceLabel as SecurityLabel]
  const resourceClassLevel = CLASSIFICATIONS[resourceClassification as Classification]
  
  // User must have equal or higher security label
  if (userLabelLevel < resourceLabelLevel) {
    return false
  }
  
  // User clearance level must be equal or higher
  if (userLevel < resourceClassLevel) {
    return false
  }
  
  return true
}

/**
 * Get security label from string
 */
export function getSecurityLabel(label: string): SecurityLabel {
  const upperLabel = label.toUpperCase()
  if (upperLabel in SECURITY_LABELS) {
    return upperLabel as SecurityLabel
  }
  return 'PUBLIC'
}

/**
 * Get classification from string
 */
export function getClassification(classification: string): Classification {
  const upperClass = classification.toUpperCase()
  if (upperClass in CLASSIFICATIONS) {
    return upperClass as Classification
  }
  return 'PUBLIC'
}

