import { UserSchema } from "@/types/user"

export const getUserName = (users: UserSchema[], userId: string): string => {
    return users.find((u) => u.id === userId)?.name || userId
}

export const getUserInitialsByName = (name: string) => {
    return name.split(" ").slice(0, 2).map((part) => part.charAt(0))
        .join("").toUpperCase()
}

export const getUserInitialsById = (users: UserSchema[], userId: string) => {
    const name = users.find((u) => u.id === userId)?.name || userId

    return name.split(" ").slice(0, 2).map((part) => part.charAt(0))
        .join("").toUpperCase()
}
