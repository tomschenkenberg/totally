import fs from "fs"
import path from "path"

type Params = Promise<{ code: string }>

export async function GET(request: Request, data: { params: Params }) {
    const params = await data.params
    try {
        const filePath = path.join(process.cwd(), "data", `${params.code}.json`)

        if (!fs.existsSync(filePath)) {
            return Response.json({ error: "Not Found" }, { status: 404 })
        }

        const data = fs.readFileSync(filePath, "utf8")

        console.log("State fetched for code:", params.code)
        return Response.json(data)
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
