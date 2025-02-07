import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from 'next/image';
import TopNav from "./TopNav";
import AppHeader from "./AppHeader";
import styles from "./Header.module.css";
import Menu from "../Menu/Menu";
import SearchForm from "../SearchForm/SearchForm";
import AuthForm from "../Auth/AuthForm";
import WhistlistIcon from "../../../public/icons/WhistlistIcon";
import UserIcon from "../../../public/icons/UserIcon";
import CartItem from "../CartItem/CartItem";
import { useWishlist } from "../../context/wishlist/WishlistProvider";

type Props = {
    title?: string;
};
const Header: React.FC<Props> = ({ title }) => {
    //@ts-ignore
    const { wishlist } = useWishlist();
    const [animate, setAnimate] = useState("");
    const [scrolled, setScrolled] = useState<boolean>(false);
    const [didMount, setDidMount] = useState<boolean>(false); // to disable Can't perform a React state Warning

    // Calculate Number of Wishlist
    let numberOfWishlist = wishlist.length;

    // Animate Wishlist Number
    const handleAnimate = useCallback(() => {
        if (numberOfWishlist === 0) return;
        setAnimate("animate__animated animate__headShake");
    }, [numberOfWishlist, setAnimate]);

    // Set animate when no of wishlist changes
    useEffect(() => {
        handleAnimate();
        setTimeout(() => {
            setAnimate("");
        }, 1000);
    }, [handleAnimate]);

    // Handle scroll event
    const handleScroll = useCallback(() => {
        const offset = window.scrollY;
        if (offset > 30) {
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    }, [setScrolled]);

    // Effect to attach and detach scroll event listener
    useEffect(() => {
        setDidMount(true);
        window.addEventListener("scroll", handleScroll);
        return () => setDidMount(false);
    }, [handleScroll]);

    // If the component is not mounted, return null
    if (!didMount) {
        return null;
    }
    return (
        <>
            {/* ===== <head> section ===== */}
            <AppHeader title={title} />

            {/* ===== Top Navigation ===== */}
            <TopNav />

            {/* ===== Skip to main content button ===== */}
            <Link
                href="#main-content"
                className="whitespace-nowrap absolute z-50 left-4 opacity-90 rounded-md bg-white px-4 py-3 transform -translate-y-40 focus:translate-y-0 transition-all duration-300"
            >
                Skip to main content
            </Link>
            {/* ===== Main Navigation ===== */}
            <nav
                className={`${scrolled ? "bg-white sticky top-0 shadow-md z-50" : "bg-transparent"
                    } w-full z-50 h-20 relative`}
            >
                <div className="app-max-width w-full">
                    <div
                        className={`flex justify-between align-baseline app-x-padding ${styles.mainMenu}`}
                    >
                        {/* Hamburger Menu and Mobile Nav */}
                        <div className="flex-1 lg:flex-0 lg:hidden">
                            <Menu />
                        </div>

                        {/* Left Nav */}
                        <ul className={`flex-0 lg:flex-1 flex ${styles.leftMenu}`}>
                            <li>
                                <Link href={'#'}>
                                    Fruits & Food
                                </Link>
                            </li>
                            <li>
                                <Link href={'#'}>
                                    Livestock
                                </Link>
                            </li>
                            <li>
                                <Link href='#'>
                                    Bags
                                </Link>
                            </li>
                            <li>
                                <Link href="#">
                                    Book Us
                                </Link>
                            </li>
                        </ul>


                        <div className="flex-1 flex justify-center items-center cursor-pointer">
                            <div className="h-auto justify-center">
                                <Link href="/" className="inline-block p-0 m-0">
                                <Image 
                                    src="/images/terra-balance-logo.png" 
                                    alt="Terra Balance Logo" 
                                    width={50} // Set appropriate width
                                    height={30} // Set appropriate height
                                   
                                 />
                                </Link>
                            </div>
                        </div>
                         {/* Right Nav */}
            <ul className={`flex-1 flex justify-end ${styles.rightMenu}`}>
              <li>
                <SearchForm />
              </li>
              <li>
                <AuthForm>
                  <UserIcon />
                </AuthForm>
              </li>
              <li>
                <Link href="#" passHref>
                  {/* <a className="relative" aria-label="Wishlist"> */}
                  <button
                    type="button"
                    className="relative"
                    aria-label="Wishlist"
                  >
                    <WhistlistIcon />
                    {numberOfWishlist > 0 && (
                      <span
                        className={`${animate} absolute text-xs -top-3 -right-3 bg-red-500 text-gray-100 py-1 px-2 rounded-full`}
                      >
                        {numberOfWishlist}
                      </span>
                    )}
                  </button>
                  {/* </a> */}
                </Link>
              </li>
              <li>
                <CartItem />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Header;