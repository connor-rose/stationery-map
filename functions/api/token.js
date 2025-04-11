export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  if (pathname === "/api/token") {
    return new Response("eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijg5N01NOTRGTUcifQ.eyJpc3MiOiJBQjU2QlVOWkJDIiwiaWF0IjoxNzQ0MzI3MTc2LCJleHAiOjE3NDQ0MTM1NzYsImJpZCI6ImlDbG91ZC5jb20uYmlzY3VpdHN0dWRpb3MucGVuZWRleCJ9.gJg_hCZpZzD0IbgpKN94fy2SperWjc7MSbZvr-C-mC5v0rHQGwn3oFQEn0v25Q2Gn5uJQB5SFRfiZdUckW_qag", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } else {
    return new Response("Not Found", { status: 404 });
  }
}
