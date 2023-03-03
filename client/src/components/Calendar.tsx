import { Transition, Dialog } from "@headlessui/react";
import { useFormikContext } from "formik";
import { Dispatch, Fragment, RefCallback, SetStateAction } from "react";
import { ClassNames, DayPicker, InputDayPickerProps } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ModalProps } from "../types/global";

const CalendarModal = ({isCalendarOpen, setFunction, dayProps, setDateField, fieldName}: ModalProps): JSX.Element => {
    const selectedStyle: ClassNames = { day_selected: "bg-orange-200 text-orange-500" };
    const { setFieldValue } = useFormikContext();
    return (
        <div className="relative flex flex-col m-auto z-50">
            <Transition appear show={isCalendarOpen} as={Fragment}>
                <Dialog
                    onClose={() => {
                        setFunction(false);
                    }}
                    open={isCalendarOpen}
                    as="div">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="inset-0 fixed opacity-50 bg-black" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <DayPicker
                                        {...dayProps}
                                        captionLayout="dropdown"
                                        onDayClick={(day) => {
                                            setFieldValue(fieldName, day);
                                            setFunction(false);
                                            setDateField(day);
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

export default CalendarModal;