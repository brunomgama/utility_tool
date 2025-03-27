export const getCountryFlag = (country: string): string | null => {
    const countryMap: Record<string, string> = {
        portugal: "🇵🇹",
        pt: "🇵🇹",
        germany: "🇩🇪",
        de: "🇩🇪",
        france: "🇫🇷",
        fr: "🇫🇷",
        usa: "🇺🇸",
        "united states": "🇺🇸",
        us: "🇺🇸",
        canada: "🇨🇦",
        ca: "🇨🇦",
        india: "🇮🇳",
        in: "🇮🇳",
        brazil: "🇧🇷",
        br: "🇧🇷",
        spain: "🇪🇸",
        es: "🇪🇸",
        italy: "🇮🇹",
        it: "🇮🇹",
        austria: "🇦🇹",
        at: "🇦🇹",
        switzerland: "🇨🇭",
        ch: "🇨🇭",
        belgium: "🇧🇪",
        be: "🇧🇪",
        netherlands: "🇳🇱",
        nl: "🇳🇱",
        uk: "🇬🇧",
        "united kingdom": "🇬🇧",
        gb: "🇬🇧",
        sweden: "🇸🇪",
        se: "🇸🇪",
        norway: "🇳🇴",
        no: "🇳🇴",
        finland: "🇫🇮",
        fi: "🇫🇮",
        australia: "🇦🇺",
        au: "🇦🇺",
        japan: "🇯🇵",
        jp: "🇯🇵",
        china: "🇨🇳",
        cn: "🇨🇳",
        korea: "🇰🇷",
        kr: "🇰🇷",
    }

    const normalized = country.trim().toLowerCase()

    const tokens = normalized.split(/[\s,]+/)

    for (const token of tokens) {

        console.log(token)
        console.log(countryMap[token])
        if (countryMap[token]) {
            return countryMap[token]
        }
    }

    for (const key in countryMap) {
        if (normalized.includes(key)) {
            return countryMap[key]
        }
    }

    return null
}
