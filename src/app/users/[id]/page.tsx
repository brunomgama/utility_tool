"use client"

import { useParams } from "next/navigation"
import UserDetailPage from "@/components/custom/detail/UserDetailPage";

export default function UserDetail() {
    const params = useParams()
    const userId = params.id as string

    return <UserDetailPage userId={userId} />
}

