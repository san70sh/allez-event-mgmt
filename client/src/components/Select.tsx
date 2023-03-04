import { useJsApiLoader, LoadScriptProps } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng, getZipCode } from "use-places-autocomplete";
import { SelectProps, EventValues as Values } from "../types/global";
import { ErrorMessage, Field, useFormikContext } from "formik";
import React, { ChangeEvent } from "react";

type Suggestion = google.maps.places.AutocompletePrediction;

const Select = ({ isLoaded, setFunction }: SelectProps): JSX.Element => {

	const {
		suggestions: { data, status },
		value: venueVal,
		setValue: setVenueVal,
		clearSuggestions,
		init,
		ready,
	} = usePlacesAutocomplete({
		initOnMount: false,
		requestOptions: {
			componentRestrictions: {
				country: "us",
			},
		},
		debounce: 300,
	});
	if (isLoaded) {
		init();
	}

	const { setFieldValue, errors, touched } = useFormikContext<Values>();

	const handleSelect =
		({ description }: Suggestion) =>
		() => {
			setVenueVal(description, false);
			setFieldValue("venue.address", description);
			setFunction(description);
			clearSuggestions();
		};

	const renderSuggestions = (): JSX.Element => {
		const suggestions = data.map((suggestion: Suggestion, idx: number) => {
			const {
				place_id,
				structured_formatting: { main_text, secondary_text },
			} = suggestion;

			return (
				<li key={place_id} id={`ex-list-item-${idx}`} onClick={handleSelect(suggestion)} className="hover:bg-slate-500 cursor-pointer text-sm font-thin mx-2" role="option">
					<strong>{main_text}, {secondary_text}</strong>
				</li>
			);
		});

		return <>{suggestions}</>;
	};

	return (
		<div className="relative space-x-16 p-2">
			<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.venue?.address && touched.venue?.address ? `border-red-500` : ""} `}>
				<Field name="venue.address" value={venueVal} placeholder="Select a venue" onChange={(e: ChangeEvent<HTMLInputElement>) => {setVenueVal(e.target.value)}} className="block p-2 rounded-lg w-full text-sm placeholder:italic appearance-none focus:outline-none bg-transparent"></Field>
				{status && (
					<ul id="suggestionBox" role="listbox" className="bg-white rounded shadow-md">
						{renderSuggestions()}
					</ul>
				)}
			</div>
			<ErrorMessage name="venue.address">{(msg) => <div className="relative px-2 text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
		</div>
	);
};

export default Select;
