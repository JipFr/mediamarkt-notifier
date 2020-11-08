
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { Store, StoreAvailability } from "./types.ts";

const hour = 1e3 * 60 * 60;

// PS5
// const pageUrl = "https://www.mediamarkt.nl/nl/product/_sony-playstation-5-digital-edition-1665134.html";
// const storeUrl = "https://www.mediamarkt.nl/nl/market-selector-list-availability.json?catEntryId=6915165";

// Slim PS4
const pageUrl = "https://www.mediamarkt.nl/nl/product/_sony-playstation-4-slim-500-gb-playstation-now-12-maanden-1676540.html";
const storeUrl = "https://www.mediamarkt.nl/nl/market-selector-list-availability.json?catEntryId=7127526";

async function isAvailable() {

	// Get main page HTML
	let mainReq = await fetch(pageUrl);
	let mainPageHtml = await mainReq.text();

	// Get store availability
	let storeReq = await fetch(storeUrl);
	let storeJson = await storeReq.json();

	// Get availability for each
	let availableOnline = !mainPageHtml.includes("Online uitverkocht");
	let availableStores: StoreAvailability[] = storeJson.availabilities.filter((store: StoreAvailability) => store.message !== "Niet op voorraad");

	// Get store objects for each store
	availableStores = availableStores.map((storeAvail: StoreAvailability) => {
		storeAvail.store = storeJson.markets.find((store: Store) => storeAvail.id === store.id);
		return storeAvail;
	}).filter(s => s.store); // Get rid of non-store objects

	// Return availability
	return {
		online: availableOnline,
		stores: availableStores
	}
}

async function sendNotification(message: string) {
	
	// Get environment vars
	let env = config();

	// Generate main form
	let fd = new FormData();
	fd.append("app_key", env.APP_KEY);
	fd.append("app_secret", env.APP_SECRET);
	fd.append("target_type", "app");
	fd.append("content", message);

	// Send form
	const pushUrl = "https://api.pushed.co/1/push";
	await fetch(pushUrl, {
		method: "POST",
		body: fd
	});
}

async function main() {
	let availability = await isAvailable();
	
	console.log(availability);

	if(availability.online) {
		await sendNotification(`Product beschikbaar\n${pageUrl}`);
	}
	if(availability.stores) {
		await sendNotification(`Product beschikbaar in: ${availability.stores.map(store => store.store.name).join(", ")}`)
	}
	
}
main();
setInterval(main, 1 * hour);