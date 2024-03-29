import { User } from "@auth0/auth0-react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment, MouseEventHandler } from "react";

interface UserItem {
  user: User
}

export interface DropDownItem {
  name: string,
  func: MouseEventHandler<HTMLButtonElement>
}

const dropDownElements = (elements: DropDownItem[]): React.ReactNode => {
    const menuItems: React.ReactElement[] = elements.map((elem: DropDownItem) => {
        return(<Menu.Item key={elem.name}>
            {({ active }) => (
            <button
              onClick={elem.func}
              className={`${active ? "text-orange-600 duration-300" : "text-orange-400 duration-300"} px-4 py-2 text-sm font-medium w-full h-full`}
            >
              {elem.name}
            </button>
          )}
        </Menu.Item>)
    })
    return menuItems;
}
export const ProfileDropDown: React.FC<{ header: UserItem; items: DropDownItem[], profileImg: string }> = ({ header, items, profileImg }) => {
  return (
    <Menu as="div">
        <Menu.Button className="text-orange-50 ring-4 ring-orange-400 font-medium rounded-full mt-2 mx-5 scale-50">
          <img src={profileImg} alt={header.user.name} className="rounded-full aspect-square object-cover" referrerPolicy="no-referrer"></img>
        </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
      <Menu.Items className="absolute right-6 top-32 z-10 w-32 py-1 text-center rounded-md bg-orange-100 shadow-md ring-1 ring-black ring-opacity-5">
        <div>
            {dropDownElements(items)}
        </div>
      </Menu.Items>
      </Transition>
    </Menu>
  );
};

export const RegDropDown = () => {};
