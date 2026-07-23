import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ itineraryId: string }> }
) {
  await params;
  const { destination, numDays, lat, lng } = await req.json();

  const completion = await deepseek.chat.completions.create({
    model: "deepseek-v4-flash",
    messages: [
      {
        role: "user",
        content: `You are a travel planning assistant. Create a ${numDays}-day itinerary for ${destination}. For each day suggest 3-4 popular, well-known tourist attractions and write a short 1-2 sentence description of how the day will flow. Use only real, specific place names. Return ONLY valid JSON with no extra text:
{"days":[{"day":1,"description":"Start your morning at... then head to...","attractions":["Place Name 1","Place Name 2","Place Name 3"]},{"day":2,"description":"Begin with... before visiting...","attractions":["Place Name 4","Place Name 5","Place Name 6"]}]}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  const skipped: string[] = [];

  const resolvedDays = await Promise.all(
    parsed.days.map(
      async ({ day, description, attractions: names }: { day: number; description?: string; attractions: string[] }) => {
        const resolved = await Promise.all(
          names.map(async (name: string) => {
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
                name + " " + destination
              )}&location=${lat},${lng}&radius=50000&key=${process.env.GOOGLE_MAPS_API_KEY}`
            );
            const data = await res.json();
            const place = data.results?.[0];
            if (!place) {
              skipped.push(name);
              return null;
            }
            return {
              placeId: place.place_id,
              name: place.name,
              address: place.formatted_address,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              rating: place.rating ?? 0,
              reviews: place.user_ratings_total ?? 0,
              photoRef: place.photos?.[0]?.photo_reference ?? null,
            };
          })
        );
        return { day, description, attractions: resolved.filter(Boolean) };
      }
    )
  );

  return NextResponse.json({ days: resolvedDays, skipped });
}
