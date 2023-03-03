import React, { Dispatch, SetStateAction, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers, useFormikContext } from "formik";
import { useAuth0 } from "@auth0/auth0-react";
import * as yup from "yup";
import { DropDown } from "./DropDown";
import { useInput } from "react-day-picker";
import CalendarModal from "./Calendar";
import LoadingSpinner from "./Loading";
import axios from "axios";

interface ProfileFormProps {
	setFunction: Dispatch<SetStateAction<boolean>>
}

interface Values {
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

interface TextInputProps {
	label: string;
	name: string;
	error: string | undefined;
	touch: boolean | undefined;
	className: string | undefined;
}

interface DropDownItem {
	name: string;
	value: string;
}

const profileSchema = yup.object().shape({
	firstName: yup.string().required("Please enter your first name").min(1),
	lastName: yup.string().required("Please enter your last name").min(1),
	gender: yup
		.string()
		.matches(/^(?:Male|Female|Others)$/, { message: "Please select a gender" })
		.required("Please select a gender"),
	phone: yup
		.string()
		.required("Please enter your phone #")
		.test("len", "Must be exactly 10 digits", (val) => val?.length === 10),
	address: yup.object().shape({
		postal_code: yup
			.string()
			.required("Zipcode Required")
			.test("len", "Must be exactly 5 digits", (val) => val?.length === 5),
		city: yup
			.string()
			.matches(/^[a-z ,.'-]+$/i)
			.required("City Required"),
		state: yup
			.string()
			.matches(/^[a-z ,.'-]+$/i)
			.required("State Required"),
		country: yup
			.string()
			.matches(/^[a-z ,.'-]+$/i)
			.required("Country Required"),
	}),
	dateOfBirth: yup.date().required("Please select your birthdate").min("1900-1-1").max(new Date(), "No future dates pls"),
});

const profileForm = ({setFunction}: ProfileFormProps): JSX.Element => {
	const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
	let initVal: Values = {
		firstName: "",
		lastName: "",
		gender: "",
		phone: "",
		address: {
			postal_code: "",
			city: "",
			state: "",
			country: "",
		},
		dateOfBirth: new Date(),
	};

	let genderVal: DropDownItem[] = [
		{
			name: "Male",
			value: "Male",
		},
		{
			name: "Female",
			value: "Female",
		},
		{
			name: "Others",
			value: "Others",
		},
	];

	const TextInput = ({ label, name, error, touch, className }: TextInputProps): JSX.Element => {
		return (
			<div className={className}>
				<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${error && touch ? `border-red-500` : ""} `}>
					<Field id={name} name={name} placeholder=" " className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
					<label htmlFor={name} className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
						{label}
					</label>
				</div>
				<ErrorMessage name={name}>{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
			</div>
		);
	};


	const { inputProps, dayPickerProps, setSelected } = useInput({
		fromYear: 1900,
		toYear: 2025,
		format: "PP",
		required: true,
	});

	const {user, getAccessTokenSilently} = useAuth0();

	return (
		<React.Fragment>
			<div className="text-center text-3xl font-bold text-orange-700 mb-2">
				<h1>Create Profile</h1>
			</div>
			<div>
				<Formik
					initialValues={initVal}
					validationSchema={profileSchema}
					onSubmit={async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
						let token = await getAccessTokenSilently();
						await axios.post("http://localhost:3000/users/signup", {user: {
							...values,
							email: user?.email,
							authId: user?.sub
						}
					}, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`
							}
						})
						setFunction(false)
					}}>
					{({ errors, touched, isSubmitting }) => (
						<Form className="max-w-3xl mx-auto rounded-lg shadow-xl overflow-hidden p-6 space-y-7">
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<TextInput label={"First Name"} name={"firstName"} error={errors.firstName} touch={touched.firstName} className="" />
								<TextInput label={"Last Name"} name={"lastName"} error={errors.lastName} touch={touched.lastName} className="" />
							</div>
							<div className="grid grid-cols-12 space-x-8 px-2">
								<div className="relative col-span-5 col-start-1">
									<div className={`border-2 rounded-lg focus-within:border-blue-500 ${errors.gender && touched.gender ? `border-red-500` : ""} `}>
										<Field as={DropDown} items={genderVal} label="Gender" className="" />
									</div>
									<ErrorMessage name="gender">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
								<TextInput label={"Phone Number"} name={"phone"} error={errors.phone} touch={touched.phone} className="relative col-span-7" />
							</div>
							<div className="relative">
								<label htmlFor="dateOfBirth" hidden>
									Date of Birth
								</label>
								<div className="grid grid-cols-12 mr-0">
									<div className={`relative border-2 col-span-6 col-start-3 rounded-lg focus-within:border-blue-500 ${errors.dateOfBirth && touched.dateOfBirth ? `border-red-500` : ""} `}>
										<Field id="dateOfBirth" name="dateOfBirth" {...inputProps} placeholder="Select your birthdate" readOnly={"readonly"} className={`block cursor-auto p-3 rounded-lg text-sm appearance-none focus:outline-none bg-transparent`} />
									</div>
									<button className="relative -mt-1 col-span-2 justify-self-end" type="button" title="Birthday" onClick={() => setIsCalendarOpen(true)}>
										<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="2 0 22 22" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
											<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
										</svg>
									</button>
								</div>

								<ErrorMessage name="dateOfBirth">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
							</div>
							<CalendarModal isCalendarOpen={isCalendarOpen} setFunction={setIsCalendarOpen} fieldName="dateOfBirth" dayProps={dayPickerProps} setDateField={setSelected} />
							<div className="border-2 border-gray-300 rounded" />
							<div className="text-center">Address</div>
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<TextInput label={"City"} name={"address.city"} error={errors.address?.city} touch={touched.address?.city} className="" />
								<TextInput label={"State"} name={"address.state"} error={errors.address?.state} touch={touched.address?.state} className="" />
							</div>
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<TextInput label={"Country"} name={"address.country"} error={errors.address?.country} touch={touched.address?.country} className="" />
								<TextInput label={"Zipcode"} name={"address.postal_code"} error={errors.address?.postal_code} touch={touched.address?.postal_code} className="" />
							</div>
							<div className="flex justify-center">
								{isSubmitting ? (
									<div className="flex justify-center border-2 border-orange-700 rounded p-2 w-32">
										<LoadingSpinner width="6" height="6"/>
									</div>
								) : (
									<button type="submit" className="bg-orange-400 py-2 px-52 rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300 ">
										Submit
									</button>
								)}
							</div>
						</Form>
					)}
				</Formik>
			</div>
		</React.Fragment>
	);
};

export default profileForm;
