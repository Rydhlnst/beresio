import { ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs"
import Link from "next/link"

export default function BusinessIntelligenceLayout({
    children,
}: {
    children: ReactNode
}) {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Business Intelligence</h2>
            </div>
            
            <div className="border-b mb-4">
                <div className="flex h-12 items-center">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-transparent mb-0 h-full p-0 flex gap-4 border-b-0 rounded-none w-full justify-start">
                            <Link href="/business-intelligence">
                                <TabsTrigger 
                                    value="overview" 
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-1 h-full cursor-pointer bg-transparent"
                                >
                                    Overview
                                </TabsTrigger>
                            </Link>
                            <Link href="/business-intelligence/hpp-calculator">
                                <TabsTrigger 
                                    value="hpp-calculator" 
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-1 h-full cursor-pointer bg-transparent"
                                >
                                    HPP Calculator
                                </TabsTrigger>
                            </Link>
                            <Link href="/business-intelligence/machine-modeling">
                                <TabsTrigger 
                                    value="machine-modeling" 
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-1 h-full cursor-pointer bg-transparent"
                                >
                                    Machine & Operations
                                </TabsTrigger>
                            </Link>
                            <Link href="/business-intelligence/profit-pricing">
                                <TabsTrigger 
                                    value="profit-pricing" 
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none py-3 px-1 h-full cursor-pointer bg-transparent"
                                >
                                    Profit & Pricing
                                </TabsTrigger>
                            </Link>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {children}
        </div>
    )
}
