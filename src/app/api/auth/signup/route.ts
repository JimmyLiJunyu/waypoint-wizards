import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email, name, password } = await request.json()
  if (!email || !name || !password) {
    return NextResponse.json({
      error: "Missing Fields"
    }, {
      status: 400
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp( {email, password} )
  if (error) return NextResponse.json({error: error.message}, {status: 400})
  
  await prisma.user.create({
    data: {id: data.user!.id, email, name}
  })

  return NextResponse.json({sucess: true})
}