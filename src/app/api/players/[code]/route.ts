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

    console.log("State saved for code:", params.code);

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

    if (!fs.existsSync(filePath)) {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const data = fs.readFileSync(filePath, "utf8");

    console.log("State fetched for code:", params.code);
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
