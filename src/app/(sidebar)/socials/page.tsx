"use client"

import FollowerList from '@/components/socials/FollowerList'
import UserSearch from '@/components/socials/UserSearch'
import RequestList from '@/components/socials/RequestList'
import { useState } from 'react'

function SocialsDashboard() {
    const [refreshToggle, setRefreshToggle] = useState(false)

    return (
        <>
            <main className="h-full bg-[#F9F9F9] p-8 flex flex-col overflow-hidden">
                <div className="max-w-4xl mx-auto w-full flex flex-col flex-1 min-h-0">
                    <div className="mb-8 shrink-0">
                        <h1 className="text-4xl font-bold">Socials</h1>
                        <p className="text-gray-500 mt-1">Manage your followers and find friends</p>
                    </div>

                    <div className="flex items-center gap-4 mb-6 shrink-0">
                        <UserSearch/>
                        <RequestList onAccept={() => setRefreshToggle(r => !r)}/>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <FollowerList refreshToggle={refreshToggle}/>
                    </div>
                </div>
            </main>
        </>
        
    )
}

export default SocialsDashboard;