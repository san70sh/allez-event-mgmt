import { Listbox, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useFormikContext } from "formik";

interface DropDownItem {
  name: string;
  value: string;
}

export const DropDown: React.FC<{ items: DropDownItem[]; label: string }> = ({ items, label }) => {
  const [selectedItem, setSelectedItem] = useState<string>(label);
  const { setFieldValue } = useFormikContext();
  useEffect(() => {
    setFieldValue(label.toLowerCase(), selectedItem);
  }, [selectedItem]);
  return (
    <div>
      <Listbox value={selectedItem} onChange={setSelectedItem}>
        <div className="relative">
          <Listbox.Button className="w-full rounded-lg bg-white p-3 text-center shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate">{selectedItem}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {items.map((item) => (
                <Listbox.Option
                  key={item.name}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 text-center ${
                      active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                    }`
                  }
                  value={item.value}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{item.name}</span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};
