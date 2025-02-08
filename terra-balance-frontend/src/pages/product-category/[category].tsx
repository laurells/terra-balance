import Link from "next/link";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Menu } from "@headlessui/react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Card from "../../components/Card/Card";
// import Pagination from "../../components/Util/utilFunc";
import { apiProductsType, itemType } from "../../context/cart/cart-types";
import DownArrow from "../../../public/icons/DownArrow";
import api from "../../config/api";
type OrderType = "latest" | "price" | "price-desc";

type Props = {
  items: itemType[];
  page: number;
  numberOfProducts: number;
  orderby: OrderType;
};

const ProductCategory: React.FC<Props> = ({
  items,
  page,
  numberOfProducts,
  orderby,
}) => {

  const router = useRouter();
  const { category } = router.query;
  const lastPage = Math.ceil(numberOfProducts / 10);

  const capitalizedCategory =
    category!.toString().charAt(0).toUpperCase() +
    category!.toString().slice(1);

  const firstIndex = page === 1 ? page : page * 10 - 9;
  const lastIndex = page * 10;

  return (
    <div>
      {/* ===== Head Section ===== */}
      <Header title={`${capitalizedCategory} - Terra Balance`} />

      <main id="main-content">
        {/* ===== Breadcrumb Section ===== */}
        <div className="bg-lightgreen h-16 w-full flex items-center">
          <div className="app-x-padding app-max-width w-full">
            <div className="breadcrumb">
              <Link href="/">
                <a className="text-gray400">Home</a>
              </Link>{" "}
              / <span className="capitalize">{category as string}</span>
            </div>
          </div>
        </div>

        {/* ===== Heading & Filter Section ===== */}
        <div className="app-x-padding app-max-width w-full mt-8">
          <h3 className="text-4xl mb-2 capitalize">{category as string}</h3>
          <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-0 justify-between mt-4 sm:mt-6">
            <span>
              Showing from {firstIndex} to {numberOfProducts < lastIndex ? numberOfProducts : lastIndex}, all: {numberOfProducts}
            </span>

            {category !== "new-arrivals" && <SortMenu orderby={orderby} />}
          </div>
        </div>

        {/* ===== Main Content Section ===== */}
        <div className="app-x-padding app-max-width mt-3 mb-14">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10 sm:gap-y-6 mb-10">
            {items.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
          {category !== "new-arrivals" && (
            // <Pagination
            //   currentPage={page}
            //   lastPage={lastPage}
            //   orderby={orderby}
            // />
            ""
          )}
        </div>
      </main>

      {/* ===== Footer Section ===== */}
      <Footer />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({
  params,
  locale,
  query: { page = 1, orderby = "latest" },
}) => {
  const paramCategory = params!.category as string;

  const start = +page === 1 ? 0 : (+page - 1) * 10;

  let numberOfProducts = 0;

  try {
    // Count products for the category
    const numberOfProductsResponse = await api.get(
      `/api/v1/products/count?category=${paramCategory}`
    );
    numberOfProducts = +numberOfProductsResponse.data.count;

    // Determine order_by parameter
    let order_by: string;
    switch (orderby) {
      case "price":
        order_by = "price.asc";
        break;
      case "price-desc":
        order_by = "price.desc";
        break;
      default:
        order_by = "createdAt.desc";
    }

    // Fetch products
    const reqUrl =
      paramCategory === "new-arrivals"
        ? `/api/v1/products?order_by=createdAt.desc&limit=10`
        : `/api/v1/products?order_by=${order_by}&offset=${start}&limit=10&category=${paramCategory}`;

    const res = await api.get(reqUrl);
    const fetchedProducts = res.data.data;

    const items: itemType[] = fetchedProducts.map((product: apiProductsType) => ({
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
        messages: "",
        items,
        numberOfProducts,
        page: +page,
        orderby,
      },
    };
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return {
      props: {
        messages: "",
        items: [],
        numberOfProducts: 0,
        page: 1,
        orderby: "latest",
      },
    };
  }
};

const SortMenu: React.FC<{ orderby: OrderType }> = ({ orderby }) => {

  const router = useRouter();
  const { category } = router.query;

  let currentOrder: string;

  if (orderby === "price") {
    currentOrder = "sort_by_price";
  } else if (orderby === "price-desc") {
    currentOrder = "sort_by_price_desc";
  } else {
    currentOrder = "sort_by_latest";
  }
  return (
    <Menu as="div" className="relative">
      <Menu.Button as="a" href="#" className="flex items-center capitalize">
        Current Order <DownArrow />
      </Menu.Button>
      <Menu.Items className="flex flex-col z-10 items-start text-xs sm:text-sm w-auto sm:right-0 absolute p-1 border border-gray200 bg-white mt-2 outline-none">
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/product-category/${category}?orderby=latest`)
              }
              className={`${active ? "bg-gray100 text-gray500" : "bg-white"
                } py-2 px-4 text-left w-full focus:outline-none whitespace-nowrap ${currentOrder === "sort_by_latest" && "bg-gray500 text-gray100"
                }`}
            >
              Sort by latest
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/product-category/${category}?orderby=price`)
              }
              className={`${active ? "bg-gray100 text-gray500" : "bg-white"
                } py-2 px-4 text-left w-full focus:outline-none whitespace-nowrap ${currentOrder === "sort_by_price" && "bg-gray500 text-gray100"
                }`}
            >
              Sort by price
            </button>
          )}
        </Menu.Item>
        <Menu.Item>
          {({ active }) => (
            <button
              type="button"
              onClick={() =>
                router.push(`/product-category/${category}?orderby=price-desc`)
              }
              className={`${active ? "bg-gray100 text-gray500" : "bg-white"
                } py-2 px-4 text-left w-full focus:outline-none whitespace-nowrap ${currentOrder === "sort_by_price_desc" &&
                "bg-gray500 text-gray100"
                }`}
            >
              Price description
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
};

export default ProductCategory;
