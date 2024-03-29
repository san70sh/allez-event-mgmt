import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers, FieldProps } from "formik";
import { useAuth0 } from "@auth0/auth0-react";
import * as yup from "yup";
import { DropDown } from "./DropDown";
import { useInput } from "react-day-picker";
import CalendarModal from "./Calendar";
import LoadingSpinner from "./Loading";
import axios, { AxiosResponse } from "axios";
import { TextInputProps, UserValues as Values } from "../@types/global";
import upload from "../assets/upload.svg";

enum actionType {
	NEW,
	EDIT,
}
interface ProfileFormProps {
	setFunction: Dispatch<SetStateAction<boolean>>;
	profileFunc: Dispatch<SetStateAction<boolean>>;
	action: actionType;
	val: Values;
}

interface DropDownItem {
	name: string;
	value: string;
}

const profileSchema = yup.object().shape({
	firstName: yup.string().required("Please enter your first name").min(1),
	lastName: yup.string().required("Please enter your last name").min(1),
	profileImg: yup.mixed().test("size", "File Size Exceeded", function (val) {
		// const initialImage = this.options.context!.initialImage;
		// const isTouched = this.parent.eventImg !== initialImage;
		if (val && val.type) {
			const max_size = 10 * 1024 * 1024;
			return val.size <= max_size;
		} else {
			return true;
		}
	}),
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

const profileForm = ({ setFunction, profileFunc, action, val: initVal }: ProfileFormProps): JSX.Element => {
	const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
	// const [userData, setUserData] = useState<Values>();
	const { user, getAccessTokenSilently } = useAuth0();
	const [profileImageURL, setProfileImageURL] = useState<string>();

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
	useEffect(() => {
		if(initVal && initVal.profileImg) {
			setProfileImageURL(`https://d2bgr0kljb65n3.cloudfront.net/${initVal.profileImg}`)
		}
	}, [initVal])

	const TextInput = ({ label, name, error, touch, className, disableValue }: TextInputProps): JSX.Element => {
		return (
			<div className={className}>
				<div className={`relative border-2 rounded-lg focus-within:border-blue-500 ${error && touch ? `border-red-500` : ""} `}>
					<Field id={name} name={name} placeholder=" " disabled={disableValue} className="block p-2 rounded-lg w-full text-lg appearance-none focus:outline-none bg-transparent " />
					<label htmlFor={name} className="absolute top-0 text-sm rounded-md bg-white p-2 m-2 origin-top-left">
						{label}
					</label>
				</div>
				<ErrorMessage name={name}>{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
			</div>
		);
	};

	const { inputProps, dayPickerProps, setSelected } = useInput({
		defaultSelected: initVal.dateOfBirth,
		fromYear: 1900,
		toYear: 2025,
		format: "PP",
		required: true,
	});

	const handleImgRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
		setProfileImageURL("");
		// setImage(undefined)
	};

	return (
		<React.Fragment>
			<div className="text-center text-3xl font-bold text-orange-700 mb-2">{action == 0 ? <h1>Create Profile</h1> : <h1>Manage Profile</h1>}</div>
			<div>
				<Formik
					initialValues={initVal}
					validationSchema={profileSchema}
					onSubmit={async (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
						let token = await getAccessTokenSilently({
							audience: "localhost:5173/api",
							scope: "read:current_user",
						});
						if (action == 0) {
							await axios.post(
								"http://localhost:3000/users/signup",
								{
									...values,
									email: user?.email,
									authId: user?.sub,
								
								},
								{
									withCredentials: true,
									headers: {
										Authorization: `Bearer ${token}`,
										"Content-Type": "multipart/form-data",
									},
								}
							);
						} else {
							await axios.put(
								"http://localhost:3000/users/",
								{
									...values,
									email: user?.email,
									authId: user?.sub,
								},
								{
									withCredentials: true,
									headers: {
										Authorization: `Bearer ${token}`,
										"Content-Type": "multipart/form-data",
									},
								}
							);
						}
						setFunction(false);
						profileFunc(true);
					}}>
					{({ errors, touched, isSubmitting }) => (
						<Form className="max-w-3xl mx-auto rounded-lg shadow-xl overflow-hidden p-6 space-y-7">
							<div>
								<Field name="profileImg">
									{({ field, form }: FieldProps) => (
										<label htmlFor="profileImg">
											{!profileImageURL && <img src={upload} alt="upload icon" className="w-7 h-7 mt-1 mx-auto" />}
											<input
												type="file"
												accept="image/*"
												id="profileImg"
												name="profileImg"
												onChange={(event) => {
													if (event.target.files) {
														form.setFieldValue("profileImg", event.target.files[0]);
														setProfileImageURL(URL.createObjectURL(event.target.files[0]));
													}
												}}
												hidden
											/>
											{profileImageURL && (
												<div className="grid grid-flow-col space-x-3">
													<div className="mx-auto">
														<img src={profileImageURL} alt="preview image" className="w-24 h-24 aspect-square object-cover my-3 rounded-full" />
													</div>
													<div className="m-auto">
														<button className="bg-red-500 border w-full p-2 text-sm rounded-lg text-center" onClick={handleImgRemove}>
															Remove
														</button>
													</div>
												</div>
											)}
										</label>
									)}
								</Field>
								<ErrorMessage name="profileImg">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
							</div>
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<TextInput label={"First Name"} name={"firstName"} error={errors.firstName} touch={touched.firstName} className="" disableValue={action == 1 ? true : false} />
								<TextInput label={"Last Name"} name={"lastName"} error={errors.lastName} touch={touched.lastName} className="" disableValue={action == 1 ? true : false} />
							</div>
							<div className="grid grid-cols-12 space-x-8 px-2">
								<div className="relative col-span-5 col-start-1">
									<div className={`border-2 rounded-lg focus-within:border-blue-500 ${errors.gender && touched.gender ? `border-red-500` : ""} `}>
										<Field as={DropDown} items={genderVal} label="Gender" value={initVal.gender ? initVal.gender : "Gender"} />
									</div>
									<ErrorMessage name="gender">{(msg) => <div className="text-red-600 text-sm text-center mt-1">{msg}</div>}</ErrorMessage>
								</div>
								<TextInput label={"Phone Number"} name={"phone"} error={errors.phone} touch={touched.phone} className="relative col-span-7" disableValue={action == 1 ? true : false} />
							</div>
							<div className="relative">
								<label htmlFor="dateOfBirth" hidden>
									Date of Birth
								</label>
								<div className="grid grid-cols-12">
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
								<TextInput label={"City"} name={"address.city"} error={errors.address?.city} touch={touched.address?.city} className="" disableValue={false} />
								<TextInput label={"State"} name={"address.state"} error={errors.address?.state} touch={touched.address?.state} className="" disableValue={false} />
							</div>
							<div className="relative px-2 grid grid-flow-col space-x-16">
								<TextInput label={"Country"} name={"address.country"} error={errors.address?.country} touch={touched.address?.country} className="" disableValue={false} />
								<TextInput label={"Zipcode"} name={"address.postal_code"} error={errors.address?.postal_code} touch={touched.address?.postal_code} className="" disableValue={false} />
							</div>
							<div className="flex justify-center">
								{isSubmitting ? (
									<div className="flex justify-center border-2 border-orange-700 rounded p-2 w-32">
										<LoadingSpinner width="6" height="6" />
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
