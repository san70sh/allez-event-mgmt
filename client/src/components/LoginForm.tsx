import React, { Fragment, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers, useFormikContext } from "formik";
import * as yup from "yup";
import { DropDown } from "../components/DropDown";
import { Dialog, Transition } from "@headlessui/react";
import { DayPicker, useInput, ClassNames } from "react-day-picker";
import "react-day-picker/dist/style.css";

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

interface DropDownItem {
	name: string;
	value: string;
}

const selectedStyle: ClassNames = { day_selected: "bg-orange-200 text-orange-500" };

const profileSchema = yup.object().shape({
	firstName: yup.string().required("Please enter your first name").min(1),
	lastName: yup.string().required("Please enter your last name").min(1),
	gender: yup
		.string()
		.matches(/^(?:m|M|male|Male|f|F|female|Female|O|o|Other|other)$/, { message: "Please select a gender" })
		.required("Please select a gender"),
	phone: yup.number().required("Please enter your phone #"),
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

const loginForm = (): JSX.Element => {
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

	const { inputProps, dayPickerProps, setSelected } = useInput({
		fromYear: 1900,
		toYear: 2025,
		format: "PP",
		required: true,
	});
	const Modal = (): JSX.Element => {
		const { setFieldValue } = useFormikContext();
		return (
			<div className="relative flex flex-col m-auto z-50">
				<Transition appear show={isCalendarOpen} as={Fragment}>
					<Dialog
						onClose={() => {
							setIsCalendarOpen(false);
						}}
						open={isCalendarOpen}
						as="div">
						<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
							<div className="inset-0 fixed opacity-50 bg-black" />
						</Transition.Child>
						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center p-4 text-center">
								<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
									<Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
										<DayPicker
											{...dayPickerProps}
											captionLayout="dropdown"
											onDayClick={(day) => {
												setFieldValue("dateOfBirth", day);
												setIsCalendarOpen(false);
												setSelected(day);
											}}
											classNames={selectedStyle}
										/>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>
			</div>
		);
	};

	return (
		<React.Fragment>
			<div>
				<Formik
					initialValues={initVal}
					validationSchema={profileSchema}
					onSubmit={(values: Values, { setSubmitting }: FormikHelpers<Values>) => {
						console.log(JSON.stringify(values, null, 2));
						setTimeout(() => {
							alert(JSON.stringify(values, null, 2));
							setSubmitting(false);
						}, 500);
					}}>
					{({ errors, touched }) => (
						<Form className="max-w-3xl mx-auto rounded-lg shadow-xl overflow-hidden p-6 space-y-7">
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<div>
									<div className={`relative mt-4 border-2 rounded-lg focus-within:border-blue-500 ${errors.firstName && touched.firstName ? `border-red-500` : ""} `}>
										<Field id="firstName" name="firstName" placeholder=" " className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
										<label htmlFor="firstName" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											First Name
										</label>
									</div>
									<ErrorMessage name="firstName">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
								<div>
									<div className={`relative mt-4 border-2 rounded-lg focus-within:border-blue-500 ${errors.lastName && touched.lastName ? `border-red-500` : ""} `}>
										<Field id="lastName" name="lastName" placeholder=" " className={`block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent`} />
										<label htmlFor="lastName" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											Last Name
										</label>
									</div>
									<ErrorMessage name="lastName">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
							</div>
							<div className="grid grid-cols-12 space-x-8 px-2">
								<div className="relative col-span-5 col-start-1">
									<div className={`border-2 rounded-lg focus-within:border-blue-500 ${errors.gender && touched.gender ? `border-red-500` : ""} `}>
										<Field as={DropDown} items={genderVal} label="Gender" className="" />
									</div>
									<ErrorMessage name="gender">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
								<div className="relative col-span-7">
									<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.phone && touched.phone ? `border-red-500` : ""} `}>
										<Field id="phone" name="phone" placeholder=" " className={`block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent`} />
										<label htmlFor="phone" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											Phone Number
										</label>
									</div>
									<ErrorMessage name="phone">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
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
							<Modal />
							<div className="border-2 border-gray-300 rounded" />
							<div className="text-center">Address</div>
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<div>
									<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.address?.city && touched.address?.city ? `border-red-500` : ""} `}>
										<Field id="city" name="address.city" placeholder=" " className={`block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent`} />
										<label htmlFor="city" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											City
										</label>
									</div>
									<ErrorMessage name="address.city">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
								<div>
									<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${errors.address?.state && touched.address?.state ? `border-red-500` : ""} `}>
										<Field id="state" name="address.state" placeholder=" " className={`block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent`} />
										<label htmlFor="state" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											State
										</label>
									</div>
									<ErrorMessage name="address.state">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
							</div>
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<div>
									<div className={`relative mt-2 border-2 rounded-lg focus-within:border-blue-500 ${errors.address?.country && touched.address?.country ? `border-red-500` : ""} `}>
										<Field id="country" name="address.country" placeholder=" " className={`block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent`} />
										<label htmlFor="country" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											Country
										</label>
									</div>
									<ErrorMessage name="address.country">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
								<div>
									<div className={`relative mt-2 border-2 rounded-lg focus-within:border-blue-500 ${errors.address?.postal_code && touched.address?.postal_code ? `border-red-500` : ""} `}>
										<Field id="postal_code" name="address.postal_code" placeholder=" " className={`block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent`} />
										<label htmlFor="postal_code" className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
											Zipcode
										</label>
									</div>
									<ErrorMessage name="address.postal_code">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
							</div>
							<div className="text-center">
								<button type="submit" className="bg-orange-400 py-2 px-52 rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300 ">
									Submit
								</button>
							</div>
						</Form>
					)}
				</Formik>
			</div>
		</React.Fragment>
	);
};

export default loginForm;
