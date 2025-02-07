import { Menu } from "@headlessui/react";
import { useRouter } from "next/router";
import Link from "next/link";
import InstagramLogo from "../../../public/icons/InstagramLogo";
import FacebookLogo from "../../../public/icons/FacebookLogo";
import DownArrow from "../../../public/icons/DownArrow";
import styles from "./Header.module.css";

type LinkProps = {
  href: string;
  locale: "en";
  active: boolean;
};

const MyLink: React.FC<LinkProps> = ({
  href,
  locale,
  //@ts-ignore
  children,
  active,
  ...rest
}) => {
  return (
    <Link href={href} locale={locale}

      className={`py-2 px-4 text-center ${active ? "bg-gray-200 text-gray-500" : "bg-white text-gray-500"
        }`}
      {...rest}
    >
      {children}
    </Link>
  );
};

const TopNav = () => {
  const router = useRouter();
  const { asPath, locale } = router;

  const getCountryCode = async () => {
    try {
      const response = await fetch('https://ipinfo.io/json');
      const data = await response.json();
      return data.country;
    } catch (error) {
      console.error('Error fetching country code:', error);
      return null;
    }
  };


  return (
    <div className="bg-black text-gray-100 hidden lg:block">
      <div className="flex justify-between app-max-width">
        <ul className={`flex ${styles.topLeftMenu}`}>
          <li>
            <a href="#" aria-label="MINT Facebook Page">
              <FacebookLogo />
            </a>
          </li>
          <li>
            <a href="#" aria-label="MINT Instagram Account">
              <InstagramLogo />
            </a>
          </li>
          <li>
            <a href="#">About us</a>
          </li>
          <li>
            <a href="#">Our policy</a>
          </li>
        </ul>
        <ul className={`flex ${styles.topRightMenu}`}>
          <li>

            <Menu
              as="div"
              //@ts-ignore
              className="relative">
              <Menu.Button
                as="a"
                //@ts-ignore
                href="#"
                //@ts-ignore
                className="flex">
                {locale === "en"} <DownArrow />
              </Menu.Button>
              <Menu.Items
                className="flex flex-col w-20 right-0 absolute p-1 border border-gray-200 bg-white mt-2 outline-none"
                style={{ zIndex: 9999 }}
              >
                <Menu.Item>
                  {/* @ts-ignore */}
                  {({ active }) => (
                    //@ts-ignore
                    <MyLink active={active} href={asPath} locale="en">
                      {("eng")}
                    </MyLink>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {/* @ts-ignore */}
                  {({ active }) => (
                    //@ts-ignore
                    <MyLink active={active} href={asPath} locale="fr">
                      {("frn")}
                    </MyLink>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </li>
          <li>
            <Menu
              as="div"
              //@ts-ignore
              className="relative">
              <Menu.Button
                as="a"
                //@ts-ignore
                href="#"
                //@ts-ignore
                className="flex">
                usd <DownArrow />
              </Menu.Button>
              <Menu.Items
                className="flex flex-col w-20 right-0 absolute p-1 border border-gray-200 bg-white mt-2 outline-none"
                style={{ zIndex: 9999 }}
              >
                <Menu.Item>
                  {/* @ts-ignore */}
                  {({ active }) => (
                    <Link
                      href="#"
                      className={`${active
                          ? "bg-gray-100 text-gray-500"
                          : "bg-white text-gray-500"
                        } py-2 px-4 text-center focus:outline-none`}
                    >
                      usd
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${active
                          ? "bg-gray-100 text-gray-500"
                          : "bg-white text-gray-500"
                        } py-2 px-4 text-center focus:outline-none`}
                    >
                      {("fre")}
                    </a>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TopNav;