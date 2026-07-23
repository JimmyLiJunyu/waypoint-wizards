import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    const email = data.user?.email

    if (!error && data.user && email) {
      const existing = await prisma.user.findUnique({ where: { id: data.user.id } })

      if (!existing) {
        const metadata = data.user.user_metadata ?? {}
        const baseName: string =
          metadata.full_name || metadata.name || email.split("@")[0]

        let name = baseName
        let suffix = 0
        while (await prisma.user.findUnique({ where: { name } })) {
          suffix += 1
          name = `${baseName}${suffix}`
        }

        await prisma.user.create({
          data: {
            id: data.user.id,
            email,
            name,
            imageUrl: metadata.avatar_url ?? metadata.picture ?? null,
          },
        })
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
