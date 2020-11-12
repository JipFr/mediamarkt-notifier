
import { config } from "https://deno.land/x/dotenv/mod.ts";
import * as colors from "https://deno.land/std@0.76.0/fmt/colors.ts";
import { Store, StoreAvailability } from "./types.ts";

const hour = 1e3 * 60 * 60;

// PS5
const pageUrl = "https://www.mediamarkt.nl/nl/product/_sony-playstation-5-digital-edition-1665134.html";
const storeUrl = "https://www.mediamarkt.nl/nl/market-selector-list-availability.json?catEntryId=6915165";
const CoolBlueURL = "https://www.coolblue.nl/product/865867/playstation-5-digital-edition.html";

// Slim PS4
// const pageUrl = "https://www.mediamarkt.nl/nl/product/_sony-playstation-4-slim-500-gb-playstation-now-12-maanden-1676540.html";
// const storeUrl = "https://www.mediamarkt.nl/nl/market-selector-list-availability.json?catEntryId=7127526";

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

	// Mediamarkt
	console.log(`${colors.yellow("[App]")} Checking at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)

	let availability = await isAvailable();

	if(availability.online) {
		await sendNotification(`Product beschikbaar\n${pageUrl}`);
		console.log(`${colors.green("[Pushed]")} Sent message about online availability at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)
	}
	if(availability.stores.length > 0) {
		await sendNotification(`Product beschikbaar in: ${availability.stores.map(store => store.store.name).join(", ")}`)
		console.log(`${colors.green("[Pushed]")} Sent message about availability in ${availability.stores.length} stores at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)
	}

	console.log(`${colors.brightYellow("[App]")} Done checking at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)

}
main();
setInterval(main, 1 * hour);

// Do coolblue
async function cbMain() {
	console.log(`${colors.yellow("[CB]")} Checking CoolBlue at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)

	let html = await (await fetch(CoolBlueURL)).text();
	
	let canOrder = !(html.includes("Door een beperkte voorraad kun je de PlayStation 5 helaas niet pre-orderen of reserveren.") || html.includes("We verkopen de eerste beschikbare PlayStations via deze pagina. De eerste voorraad van de PlayStation 5 zal niet beschikbaar zijn in onze winkels."))
	
	if(canOrder) {
		await sendNotification("CoolBlue is beschikbaar");
		console.log(`${colors.green("[Pushed CB]")} Sent message about availability on CoolBlue at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)
	}
	console.log(`${colors.brightYellow("[CB]")} Done checking CoolBlue at ${new Date().toISOString().split(".")[0].split("T").join(" ")}`)

}
cbMain();
setInterval(cbMain, 1e3 * 60 * 3);