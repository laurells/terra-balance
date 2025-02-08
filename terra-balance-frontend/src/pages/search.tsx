import { useCallback, useEffect, useState } from "react";
import { GetServerSideProps, GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Card from "../components/Card/Card";
// import Pagination from "../components/Util/Pagination";
import useWindowSize from "../components/Util/useWindowSize";
import { apiProductsType, itemType } from "../context/cart/cart-types";
import axios from "axios";
import https from 'https';
import api from "../config/api";



type Props = {
  items: itemType[];
  searchWord: string;
};

const agent = new https.Agent({  
  secureOptions: require('constants').SSL_OP_LEGACY_SERVER_CONNECT
});

const Search: React.FC<Props> = ({ items, searchWord }) => {
  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`Terra Balance`} />

      <main id="main-content">
        {/* ===== Breadcrumb Section ===== */}
        <div className="bg-lightgreen h-16 w-full flex items-center">
          <div className="app-x-padding app-max-width w-full">
            <div className="breadcrumb">
              <Link href="/">
                <a className="text-gray400">Home</a>
              </Link>{" "}
              / <span>Search results</span>
            </div>
          </div>
        </div>

        {/* ===== Heading & Filter Section ===== */}
        <div className="app-x-padding app-max-width w-full mt-8">
          <h1 className="text-3xl mb-2">
            Search results: &quot;{searchWord}&quot;
          </h1>
          {items.length > 0 && (
            <div className="flex justify-between mt-6">
              <span>
                {/* Showing `{products}` result(s), { */}
                  products: items.length,
                
              </span>
            </div>
          )}
        </div>

        {/* ===== Main Content Section ===== */}
        <div className="app-x-padding app-max-width mt-3 mb-14">
          {items.length < 1 ? (
            <div className="flex justify-center items-center h-72">
              No Result
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-y-6 mb-10">
              {items.map((item) => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query: { q = "" },
}) => {
  try {
    const res = await api.get(
      `/api/v1/products/search?q=${q}`, { httpsAgent: agent }
    );
    const fetchedProducts: apiProductsType[] = res.data.data.map(
      (product: apiProductsType) => ({
        ...product,
        img1: product.img1 || product.image1,
        img2: product.img2 || product.image2,
      })
    );

    let items: itemType[] = fetchedProducts.map((product: apiProductsType) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      img1: product.img1,
      img2: product.img2,
      discountPercent: product.discountPercent,
      description: product.description,
      stock: product.stock,
      category: product.category,
      categoryName: product.category?.name
    }));

    return {
      props: {
        items,
        searchWord: q,
      },
    };
  } catch (error) {
    console.error('Search products error:', error);
    return {
      props: {
        items: [],
        searchWord: q,
      },
    };
  }
};

export default Search;
