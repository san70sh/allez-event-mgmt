import { GoogleMap, MarkerF, LoadScript, LoadScriptProps } from "@react-google-maps/api";
import * as React from "react";
import { getLatLng, getGeocode } from "use-places-autocomplete";

type VenueProps = {
	venue: string;
};

// const libraries: LoadScriptProps["libraries"] = ["places"];
type LatLng = google.maps.LatLngLiteral;
type GeocodeResult = google.maps.GeocoderResult[];
type MapOptions = google.maps.MapOptions;

const Map: React.FC<VenueProps> = (props) => {
	const [center, setCenter] = React.useState<LatLng>({ lat: 40.758, lng: -73.9855 });
	const [venueCoord, setVenueCoord] = React.useState<LatLng>(center);

	const options = React.useMemo<MapOptions>(
		() => ({
			mapId: "d8165c145d699106",
			disableDefaultUI: true,
			clickableIcons: false,
		}),
		[]
	);

	React.useEffect(() => {
		async function getCoord(venue: string): Promise<void> {
			try {
				let geoCode: GeocodeResult = await getGeocode({
					address: venue,
					region: "us",
					componentRestrictions: {
						country: "us",
					},
				});
				let newCoord: LatLng = getLatLng(geoCode[0]);
				if (newCoord) {
					setVenueCoord(newCoord);
					setCenter(newCoord);
				}
			} catch (e) {
				console.log(e);
			}
		}

		if (props.venue !== "") {
			getCoord(props.venue);
		}
	}, [props.venue]);

	return (
		<div className="my-2">
			<GoogleMap
				center={center}
				zoom={15}
				mapContainerStyle={{
					height: `70vh`,
				}}
				mapContainerClassName={`rounded-lg border border-slate-400`}
				options={options}>
				{venueCoord && <MarkerF position={venueCoord} icon="https://img.icons8.com/plasticine/40/000000/marker.png" animation={google.maps.Animation.DROP} />}
			</GoogleMap>
		</div>
	);
};

export default Map;
