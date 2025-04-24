import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

export default async function Home() {
  const session = await getServerSession()

  // If authenticated, redirect to dashboard
  // If not, redirect to sign-in page
  if (session) {
  redirect("/dashboard")
  } else {
    redirect("/auth/signin")
  }
}
