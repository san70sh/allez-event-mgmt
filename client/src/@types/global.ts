import { User } from "@auth0/auth0-react";
import { Dispatch, SetStateAction } from "react";
import { InputDayPickerProps } from "react-day-picker";
import IEvent from "../models/events.model";


export enum ActionType {
	NEW,
	EDIT,
}

export interface TextInputProps {
    label: string;
    name: string;
    error: string | undefined;
    touch: boolean | undefined;
    className: string | undefined;
	disableValue: boolean;
}

export interface EventResponse {
    count: number;
    events: IEvent[];

}


export interface EventValues {
	eventImg: Blob | undefined;
	name: string;
	category: string[];
	price: number;
	description: string;
	totalSeats: number;
	minAge: number;
	venue: string;
	eventDate: Date;
    eventStartTime: string,
    eventEndTime: string
}

export interface UserValues {
	firstName: string;
	lastName: string;
	gender: string;
	phone: string;
	address: {
		city: string;
		postal_code: string;
		state: string;
		country: string;
	};
	dateOfBirth: Date;
}

export interface SelectProps {
    isLoaded: boolean
    setFunction: Dispatch<SetStateAction<string>>,
	value: string
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
	// value: Date
}