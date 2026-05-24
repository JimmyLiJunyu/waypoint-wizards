import * as jose from 'jose';

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
        return payload as {userId: string; email: string }
    } catch (error) {
        return null;
    }
}