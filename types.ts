
export interface Store {
	/** Address */
	description: string;
	/** Store ID */
	id: string;
	/** Latitude */
	lat: string;
	/** Longitude */
	lng: string;
	/** City name */
	name: string;
}

export interface StoreAvailability {
	/** Availability string */
	message: string;
	/** Number as string, no idea what this is used for */
	level: string;
	/** Store ID (number as string) */
	id: string;
	/** Store with location and such */
	store: Store;
}