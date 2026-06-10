type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

export function useRiskColor() {
  const riskConfig: Record<RiskLevel, { color: string; label: string; icon: string }> = {
    BAJO: { color: 'green', label: 'Bajo', icon: 'i-heroicons-check-circle' },
    MEDIO: { color: 'yellow', label: 'Medio', icon: 'i-heroicons-exclamation-triangle' },
    ALTO: { color: 'orange', label: 'Alto', icon: 'i-heroicons-exclamation-circle' },
    CRITICO: { color: 'red', label: 'Crítico', icon: 'i-heroicons-x-circle' },
  }

  function getRiskConfig(risk?: string | null) {
    if (!risk) return null
    return riskConfig[risk as RiskLevel] ?? null
  }

  return { getRiskConfig, riskConfig }
}
