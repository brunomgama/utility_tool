export const getInitials = (name: string) => {
    return name.split(" ").slice(0, 2).map((part) => part.charAt(0))
        .join("").toUpperCase()
}
