export default {
  async fetch(request, env, ctx) {
	const url = new URL(request.url);
	const pathname = url.pathname;

	if (pathname === "/api/locations") {
	  return await handleLocations();
	} else if (pathname === "/api/token") {
	  return await handleToken();
	} else {
	  return new Response("Not Found", { status: 404 });
	}
  }
};

async function handleLocations() {
  const cloudKitEndpoint = "https://api.apple-cloudkit.com/database/1/iCloud.com.biscuitstudios.penedex/production/public/records/query";
  const cloudKitApiToken = "38354ca7578a822b3f6a48e35ec9e59830ea443eb8bf5c916c4e472cde70d1b4";

  const queryBody = {
	query: { recordType: "CD_PenShop" }
  };

  const cloudkitResponse = await fetch(cloudKitEndpoint, {
	method: "POST",
	headers: {
	  "Content-Type": "application/json",
	  "Authorization": `Bearer ${cloudKitApiToken}`
	},
	body: JSON.stringify(queryBody)
  });

  const data = await cloudkitResponse.json();

  return new Response(JSON.stringify(data), {
	headers: {
	  "Content-Type": "application/json",
	  "Access-Control-Allow-Origin": "*"
	}
  });
}

async function handleToken() {
  const mapkitJWT = "eyJhbGciOiJFUzI1NiIsImtpZCI6Ijg5N01NOTRGTUciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJBQjU2QlVOWkJDIiwiaWF0IjoxNzQ0MzIxMzgwLCJleHAiOjE3NDQ0MDc3ODAsImJpZCI6ImlDbG91ZC5jb20uYmlzY3VpdHN0dWRpb3MucGVuZWRleCJ9.bQmPj9Ic_nuy1B1nRznAMZyZCUYLOp8IZWvliRhHvfDWSVydl_dHkv85SD_HUShHiE5bvYrekNi8VDyfn_KW2A";

  return new Response(mapkitJWT, {
	headers: {
	  "Content-Type": "text/plain",
	  "Access-Control-Allow-Origin": "*"
	}
  });
}
