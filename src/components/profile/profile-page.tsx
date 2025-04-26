"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { UserProfileForm } from "./user-profile-form"
import { PasswordResetForm } from "./password-reset-form"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("profile")

  if (!session?.user) {
    return (
      <div className="container mx-auto py-10">
        <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/30 dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Profile</CardTitle>
            <CardDescription>Please sign in to view your profile</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-white text-2xl">
              {session.user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{session.user.name}</h1>
            <p className="text-muted-foreground">{session.user.email}</p>
          </div>
        </div>
        
        <Separator className="bg-white/20 dark:bg-white/10" />
        
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/10 dark:bg-black/20">
            <TabsTrigger value="profile">Profile Information</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/30 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
                <CardDescription>View your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfileForm user={session.user} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/30 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Security</CardTitle>
                <CardDescription>Manage your password and account security</CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordResetForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card className="bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/30 dark:border-white/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Login Activity</CardTitle>
                <CardDescription>View your recent login activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md bg-white/5 p-4 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-white">Current Session</h4>
                        <p className="text-sm text-white/70">Web Browser - Windows</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-200 hover:bg-green-500/30 hover:text-green-100">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50">Started: {new Date().toLocaleString()}</p>
                  </div>
                  
                  <div className="text-sm text-white/70 mt-4">
                    For security purposes, login history is not stored. This only shows your current active session.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 