
export default async function Profile({ params }: { params: Promise<{id: string}> }) {
    const { id } = await params
    return (
        <>
            <h1>{id}</h1>
        </>
    )
}