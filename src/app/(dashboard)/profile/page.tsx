import { Metadata } from "next"
import ProfilePage from "@/components/profile/profile-page"

export const metadata: Metadata = {
  title: "Profile | SmartOne ERP",
  description: "User profile and account settings",
}

export default function Profile() {
  return <ProfilePage />
} 