import fs from "fs";
import path from "path";

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const requestData = await request.json();
    const filePath = path.join(process.cwd(), "data", `${params.code}.json`);
    fs.writeFileSync(filePath, JSON.stringify(requestData));

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const filePath = path.join(process.cwd(), "data", `${params.code}.json`);
    const data = fs.readFileSync(filePath, "utf8");
    return new Response(data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
