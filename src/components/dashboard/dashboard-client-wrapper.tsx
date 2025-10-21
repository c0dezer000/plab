"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import dynamic from "next/dynamic"
import React from "react"

// Dynamically import the real client component on the browser only to avoid SSR id mismatches
const DynamicDashboardClient = dynamic(
  () => import("./dashboard-client").then((mod) => mod.DashboardClient),
  { ssr: false },
)

export default function DashboardClientWrapper(props: any) {
  return <DynamicDashboardClient {...props} />
}
