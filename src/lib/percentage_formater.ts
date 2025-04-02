export const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("de-DE", { style: "percent", minimumFractionDigits: 1 }).format(value)
}
