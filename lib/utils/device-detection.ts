/**
 * Detect device type from user agent string
 */
export function detectDeviceType(userAgent?: string): string {
  if (!userAgent) {
    return 'unknown'
  }
  
  const ua = userAgent.toLowerCase()
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipad')) {
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    }
    return 'mobile'
  }
  
  if (ua.includes('desktop') || ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    return 'desktop'
  }
  
  if (ua.includes('laptop')) {
    return 'laptop'
  }
  
  // Default to desktop for most browsers
  return 'desktop'
}

/**
 * Get location from IP address (simplified - in production use geolocation service)
 */
export function getLocationFromIP(ipAddress?: string): string | undefined {
  if (!ipAddress) {
    return undefined
  }
  
  // In production, use a geolocation service
  // For now, return IP as location identifier
  return ipAddress
}

