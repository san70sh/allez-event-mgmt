import { User } from "@auth0/auth0-react";
import { Dispatch, SetStateAction } from "react";
import { InputDayPickerProps } from "react-day-picker";

export interface TextInputProps {
    label: string;
    name: string;
    error: string | undefined;
    touch: boolean | undefined;
    className: string | undefined;
}

export interface EventValues {
	// eventImgs: string[];
	name: string;
	category: string[];
	price: number;
	description: string;
	totalSeats: number;
	minAge: number;
	venue: {
		address: string | undefined;
		// city: string;
		// state: string;
		// country: string;
		// geoLocation: { lat: number; long: number };
	};
	eventDate: Date;
    eventStartTime: string,
    eventEndTime: string
}

export interface SelectProps {
    isLoaded: boolean
    setFunction: Dispatch<SetStateAction<string>>,
}


export interface Auth0ProviderConfigProps {
    children?: React.ReactNode;
}

export interface ModalProps {
    isCalendarOpen: boolean,
    setFunction: Dispatch<SetStateAction<boolean>>,
    dayProps: InputDayPickerProps,
    setDateField: Function,
    fieldName: string,
}

export interface TextInputProps {
	label: string;
	name: string;
	error: string | undefined;
	touch: boolean | undefined;
	className: string | undefined;
	inputType: string;
}
