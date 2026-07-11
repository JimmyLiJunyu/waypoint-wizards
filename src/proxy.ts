import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
    const supabaseResponse = NextResponse.next( {request} )

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookies) => {
                    cookies.forEach(({name, value, options}) => {
                        request.cookies.set(name, value)
                        supabaseResponse.cookies.set(name, value, options)
                    })
                }
            }
        }
    )

    const { data: {user} } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/new-trip') || pathname.startsWith('/trip')
    const isAuth = pathname.startsWith('/login') || pathname.startsWith('/sign-up')
    
    if (isProtected && !user) return NextResponse.redirect(new URL('/login', request.url))
    
    if (isAuth && user) return NextResponse.redirect(new URL('/dashboard', request.url))
    
    return supabaseResponse
}

export const config = {
    matcher: ['/new-trip/:path*', '/login', '/sign-up', '/trip/:path*', '/dashboard/:path*']
}