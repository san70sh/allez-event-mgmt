import React from "react";
import IEvent from "../models/events.model";
import { useInput } from "react-day-picker";
import * as yup from "yup";
import { ErrorMessage, Field, FieldProps, Form, Formik, FormikHelpers } from "formik";
import Map from "./Map";
import { useJsApiLoader, LoadScriptProps } from "@react-google-maps/api";
import { getGeocode, getLatLng, getZipCode } from "use-places-autocomplete";
import axios from "axios";
import CalendarModal from "./Calendar";
import LoadingSpinner from "./Loading";
import dayjs from "dayjs";
import { EventValues as Values } from "../types/global";
import Select from "./Select";
import { TimePicker, Select as CategorySelect, SelectProps } from "antd";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

interface venue {
	address: string;
	city: string;
	state: string;
	geoLocation: {
		lat: number;
		long: number;
	};
}

type LatLng = google.maps.LatLngLiteral;
type GeocodeResult = google.maps.GeocoderResult[];
const libraries: LoadScriptProps["libraries"] = ["places"];

export enum EventType {
	NEW,
	EDIT,
}

type EventProps = {
	type: EventType;
};

const categoryOpts: SelectProps["options"] = [
	{ value: "Career", label: "Career" },
	{ value: "Charity", label: "Charity" },
	{ value: "Entertainment", label: "Entertainment" },
	{ value: "Exploration", label: "Exploration" },
	{ value: "Food and Drink", label: "Food and Drinks" },
	{ value: "Music", label: "Music" },
	{ value: "Night Life", label: "Night Life" },
	{ value: "Science and Tech", label: "Science and Tech" },
	{ value: "Sports", label: "Sports" },
	{ value: "Other", label: "Other" },
];


const eventSchema = yup.object().shape({
	name: yup.string().required("Please enter the event name").min(1),
	price: yup
	.string()
	.required("Please enter 0 if it is a free event")
	.min(0)
	.max(999, "Events with prices > 1000 are not supported")
	.test("number", "Please enter a numeric value", (val) => !isNaN(parseInt(val!))),
	description: yup.string(),
	totalSeats: yup.number().required().min(0),
	minAge: yup.number().required().min(0),
	category: yup.array().of(yup.string()).required().min(1),
	venue: yup.object().shape({
		address: yup
		.string()
		.matches(/^[a-z0-9 ,.'-]+$/i)
		.required("Address Required"),
		// city: yup
		// 	.string()
		// 	.matches(/^[a-z ,.'-]+$/i)
		// 	.required("City Required"),
		// state: yup
		// 	.string()
		// 	.matches(/^[a-z ,.'-]+$/i)
		// 	.required("State Required"),
		// country: yup
		// 	.string()
		// 	.matches(/^[a-z ,.'-]+$/i)
		// 	.required("Country Required"),
	}),
	eventDate: yup.date().required("Please select the date of the event").min(dayjs(new Date()).add(1, "day"), "Event must be after today"),
	eventStartTime: yup.string().required("Enter start time"),
	eventEndTime: yup
	.string()
	.required("Enter end time")
	.test("min_end_time", "Enter atleast 30 minutes from start time", function (val) {
		const { eventStartTime } = this.parent;
		return dayjs(val, "HH:mm").isAfter(dayjs(eventStartTime, "HH:mm"));
	}),
});

const NewEvent = ({type}: EventProps): JSX.Element => {
	const [isCalendarOpen, setIsCalendarOpen] = React.useState<boolean>(false);
	const [venueLoc, setVenueLoc] = React.useState<string>("");
	const [startTime, setStartTime] = React.useState<dayjs.Dayjs | undefined>(undefined);
	const [endTime, setEndTime] = React.useState<dayjs.Dayjs | undefined>(undefined);
	const {user, getAccessTokenSilently} = useAuth0();

	const navigate = useNavigate();
	
	let initVal: Values = {
		// eventImgs: [],
		name: "",
		category: [],
		price: 0,
		description: "",
		totalSeats: 0,
		minAge: 0,
		venue: {
			address: undefined,
			// city: "",
			// state: "",
			// country: "",
			// geoLocation: { lat: 0, long: 0 },
		},
		eventDate: new Date(),
		eventStartTime: "",
		eventEndTime: "",
	};
	const { isLoaded } = useJsApiLoader({
		id: "google-script",
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API!,
		libraries: libraries,
	});

	const { inputProps, dayPickerProps, setSelected } = useInput({
		fromYear: 2023,
		toYear: 2025,
		format: "PP",
		required: true,
	});

	const getGCAndZip = async (venue: string) => {
		let geoCode: GeocodeResult = await getGeocode({
			address: venue,
			region: "us",
			componentRestrictions: {
				country: "us",
			},
		});

		let newZip: string = "";
		let newCoord: LatLng = getLatLng(geoCode[0]);
		if (getZipCode(geoCode[0], false) !== null) {
			newZip = getZipCode(geoCode[0], false) as string;
		}

		return { zipCode: newZip, venueCoord: newCoord };
	};

	return (
		<div>
			<div className="mx-4 max-h-10">
				<div className="grid grid-cols-2 gap-4">
					<div className="bg-white rounded shadow-md px-8 pt-6 pb-8 my-5">
						<Formik
							initialValues={initVal}
							validationSchema={eventSchema}
							onSubmit={async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
								let { zipCode, venueCoord } = await getGCAndZip(venueLoc);
								let completeAddress = venueLoc?.split(",");
								let token = await getAccessTokenSilently();
								let newEvent = await axios.post("http://localhost:3000/events/new", {
									...values,
									venue: {
										address: completeAddress[0].trim(),
										city: completeAddress[1].trim(),
										state: completeAddress[2].trim(),
										country: completeAddress[3].trim(),
										zip: parseInt(zipCode),
										geoLocation: {
											lat: venueCoord.lat,
											long: venueCoord.lng,
										},
									},
									hostId: user?.sub
								},{
									withCredentials: true,
									headers: {
										Authorization: `Bearer ${token}`
									}
								}
								);

								if(newEvent) {
									navigate("/")
								}
								
							}}>
							{({ errors, touched, isSubmitting }) => (
								<Form>
									<div className="relative px-2 grid pb-4">
										<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.name && touched.name ? `border-red-500` : ""} `}>
											<Field id="name" name="name" placeholder=" " className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
											<label htmlFor="name" className="absolute top-0 text-sm rounded-md bg-white text-gray-600 italic p-2 m-2 origin-top-left">
												Event Name
											</label>
										</div>
										<ErrorMessage name="name">{(msg) => <div className="relative text-red-600 text-sm text-center mt-1 px-2">{msg}</div>}</ErrorMessage>
									</div>
									<div className="relative px-2 pb-4">
										<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.description && touched.description ? `border-red-500` : ""} `}>
											<Field id="description" name="description" as="textarea" rows="4" placeholder=" " className="relative block p-2 rounded-lg w-full text-lg appearance-none focus-within:outline-none bg-transparent" />
											<label htmlFor="description" className="absolute top-0 text-sm rounded-md bg-white text-gray-600 italic p-2 m-2 origin-top-left">
												Event Description
											</label>
										</div>
										<ErrorMessage name="description">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
									</div>
									<div className="relative px-2 pb-4">
										<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.category && touched.category ? `border-red-500` : ""} `}>
											<Field>
												{({ form }: FieldProps) => (
													<CategorySelect
														mode="multiple"
														allowClear
														showSearch
														size="large"
														style={{ width: "100%", position: "relative", display: "block", fontStyle: "italic", fontSize: "9" }}
														placeholder="Please select a category"
														options={categoryOpts}
														onChange={(val) => {
															form.setFieldValue("category", val);
														}}
													/>
												)}
											</Field>
										</div>
										<ErrorMessage name="category">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
									</div>
									<div className="relative px-2 grid pb-4">
										<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.price && touched.price ? `border-red-500` : ""} `}>
											<Field id="price" name="price" placeholder=" " className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
											<label htmlFor="price" className="absolute top-0 text-sm rounded-md bg-white text-gray-600 italic p-2 m-2 origin-top-left">
												Registration Fee
											</label>
										</div>
										<ErrorMessage name="price">{(msg) => <div className="relative text-red-600 text-sm text-center mt-1 px-2">{msg}</div>}</ErrorMessage>
									</div>
									<div className="relative px-2 grid grid-flow-col space-x-16">
										<div className="relative px-2 grid pb-4">
											<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.totalSeats && touched.totalSeats ? `border-red-500` : ""} `}>
												<Field id="totalSeats" name="totalSeats" placeholder=" " className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
												<label htmlFor="totalSeats" className="absolute top-0 text-sm rounded-md bg-white text-gray-600 italic p-2 m-2 origin-top-left">
													Total Seats
												</label>
											</div>
											<ErrorMessage name="totalSeats">{(msg) => <div className="relative text-red-600 text-sm text-center mt-1 px-2">{msg}</div>}</ErrorMessage>
										</div>
										<div className="relative px-2 grid pb-4">
											<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.minAge && touched.minAge ? `border-red-500` : ""} `}>
												<Field id="minAge" name="minAge" placeholder=" " className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
												<label htmlFor="minAge" className="absolute top-0 text-sm rounded-md bg-white text-gray-600 italic p-2 m-2 origin-top-left">
													Minimum Age
												</label>
											</div>
											<ErrorMessage name="minAge">{(msg) => <div className="relative text-red-600 text-sm text-center mt-1 px-2">{msg}</div>}</ErrorMessage>
										</div>
									</div>
									<div className="border-2 border-gray-300 rounded my-4" />
									<div className="text-center">Venue</div>
									<Select isLoaded={isLoaded} setFunction={setVenueLoc} />
									<div className="grid"></div>
									{/* <div className="relative px-2 grid grid-flow-col space-x-16">
										<TextInput label={"City"} name={"venue.city"} inputType="input" error={errors.venue?.city} touch={touched.venue?.city} className="" />
										<TextInput label={"State"} name={"venue.state"} inputType="input" error={errors.venue?.state} touch={touched.venue?.state} className="" />
										</div>
										<div className="relative px-2 grid grid-flow-col space-x-16">
										<TextInput label={"Country"} name={"venue.country"} inputType="input" error={errors.venue?.country} touch={touched.venue?.country} className="" />
									</div> */}
									<div className="grid px-2 pb-4">
										<div className="relative">
											<label htmlFor="eventDate" hidden>
												Event Date
											</label>
											<div className="grid grid-cols-12 justify-center">
												<div className={`relative border-2 col-span-7 col-start-3 rounded-lg focus-within:border-blue-500 ${errors.eventDate && touched.eventDate ? `border-red-500` : ""} `}>
													<Field id="eventDate" name="eventDate" {...inputProps} placeholder="Enter event date" readOnly={"readonly"} className={`block cursor-auto p-3 rounded-lg text-sm appearance-none focus:outline-none bg-transparent placeholder:italic`} />
												</div>
												<button className="relative -mt-1 col-span-1 justify-self-end" type="button" title="Event Date" onClick={() => setIsCalendarOpen(true)}>
													<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="2 0 22 22" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
														<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
													</svg>
												</button>
											</div>
											<ErrorMessage name="eventDate">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
										</div>
										<CalendarModal isCalendarOpen={isCalendarOpen} setFunction={setIsCalendarOpen} fieldName="eventDate" dayProps={dayPickerProps} setDateField={setSelected} />
									</div>
									<div className="grid grid-flow-col space-x-6">
										<div>
											<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.eventStartTime && touched.eventStartTime ? `border-red-500` : ""} `}>
												<Field>
													{({ form }: FieldProps) => (
														<TimePicker
															className="h-full w-full placeholder:italic"
															use12Hours
															value={startTime}
															minuteStep={15}
															showNow={false}
															defaultValue={startTime}
															format={"h:mm A"}
															onSelect={(time) => {
																setStartTime(time);
																form.setFieldValue("eventStartTime", dayjs(time).format("h:mm A"));
															}}
														/>
													)}
												</Field>
											</div>
											<ErrorMessage name="eventStartTime">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
										</div>
										<div>
											<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.eventEndTime && touched.eventEndTime ? `border-red-500` : ""} `}>
												<Field>
													{({ form }: FieldProps) => (
														<TimePicker
															className="h-full w-full placeholder:italic"
															use12Hours
															value={endTime}
															minuteStep={15}
															showNow={false}
															defaultValue={endTime}
															format={"h:mm A"}
															onSelect={(time) => {
																setEndTime(time);
																form.setFieldValue("eventEndTime", dayjs(time).format("h:mm A"));
															}}
														/>
													)}
												</Field>
											</div>
											<ErrorMessage name="eventEndTime">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
										</div>
									</div>
									<div className="flex justify-center my-4">
										{isSubmitting ? (
											<div className="flex justify-center border-2 border-orange-700 rounded p-2 w-32">
												<LoadingSpinner width="6" height="6" />
											</div>
										) : (
											<button type="submit" className="bg-orange-400 py-2 mx-14 px-32 rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300 ">
												Submit
											</button>
										)}
									</div>
								</Form>
							)}
						</Formik>
					</div>
					<div className="grid-cols-1">{isLoaded ? <Map venue={venueLoc} /> : <div className="w-full animate-spin"></div>}</div>
				</div>
			</div>
		</div>
	);
};

export default NewEvent;
