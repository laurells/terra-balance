import { NextComponentType, NextPageContext } from "next";
import Router from "next/router";
import NProgress from "nprogress";
import dotenv from 'dotenv';
import { Fragment } from "react"
dotenv.config();
import { ProvideCart } from "../context/cart/CartProvider";
import { ProvideWishlist } from "../context/wishlist/WishlistProvider";
import { ProvideAuth } from "../context/AuthContext";
import "../styles/globals.css";
// import "animate.css";
import "nprogress/nprogress.css";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';


Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());

type AppCustomProps = {
  Component: NextComponentType<NextPageContext, any, {}>;
  pageProps: any;
  cartState: string;
  wishlistState: string;
};

const MyApp = ({ Component, pageProps }: AppCustomProps) => {
  const locale = 'en'; // Replace this with your logic to determine the locale

  return (
    <Fragment>
      <ProvideAuth>
        <ProvideWishlist>
          <ProvideCart>
            <Component {...pageProps} />
          </ProvideCart>
        </ProvideWishlist>
      </ProvideAuth>
    </Fragment>
  );
};

export default MyApp;