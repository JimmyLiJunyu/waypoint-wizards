import * as jose from 'jose';
import { cookies } from 'next/headers'


const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key');

export async function signJWT(payload: {userId: string; email: string }) {
    return await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime('24h')
        .sign(SECRET);
}


export async function verifyJWT(token: string) {
    try {
        const { payload } = await jose.jwtVerify(token, SECRET);
        return payload as {userId: number; email: string }
    } catch (error) {
        return null;
    }
}

export async function getCurrUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value
    if (!token) return null
    const payload = await verifyJWT(token)
    return payload ? String(payload.userId) : null

}