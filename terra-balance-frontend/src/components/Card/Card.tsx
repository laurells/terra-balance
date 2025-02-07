import { FC, useState } from "react";
import Link from "next/link";
import Image from "next/image";
// import { useTranslations } from "next-intl";

import Heart from "../../../public/icons/Heart";
import styles from "./Card.module.css";
import HeartSolid from "../../../public/icons/HeartSolid"
import { itemType } from "../../context/cart/cart-types";
import { useCart } from "../../context/cart/CartProvider";
import { useWishlist } from "../../context/wishlist/WishlistProvider";

type Props = {
  item: itemType;
};

const Card: FC<Props> = ({ item }) => {
//   const t = useTranslations("CartWishlist");
  const { wishlist, addToWishlist, deleteWishlistItem } = useWishlist();
  const { addOne } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isWLHovered, setIsWLHovered] = useState(false);

  const { id, name, price, img1, img2 } = item;

  const itemLink = `/products/${encodeURIComponent(id)}`;

  const alreadyWishlisted =
    wishlist.filter((wItem) => wItem.id === id).length > 0;

    const handleWishlist = () => {
      if (typeof item.id === 'number') {
        const wishlistItem = { ...item, id: item.id as number };
        alreadyWishlisted ? deleteWishlistItem!(wishlistItem) : addToWishlist!(wishlistItem);
      } else {
        // Handle the case where 'id' is not a number
        console.error('Item id is not a number:', item.id);
      }
    };
    

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <Link href={itemLink}>
          <a
            tabIndex={-1}
            onMouseOver={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {!isHovered && (
              <Image
                src={img1 as string}
                alt={name}
                width={230}
                height={300}
                layout="responsive"
              />
            )}
            {isHovered && (
              <Image
                className="transition-transform transform hover:scale-110 duration-1000"
                src={img2 as string}
                alt={name}
                width={230}
                height={300}
                layout="responsive"
              />
            )}
          </a>
        </Link>
        <button
          type="button"
          className="absolute top-2 right-2 p-1 rounded-full"
          aria-label="Wishlist"
          onClick={handleWishlist}
          onMouseOver={() => setIsWLHovered(true)}
          onMouseLeave={() => setIsWLHovered(false)}
        >
          {isWLHovered || alreadyWishlisted ? <HeartSolid /> : <Heart />}
        </button>
        <button
          type="button"
          onClick={() => addOne!(item)}
          className={styles.addBtn}
        >
          Add To Cart
        </button>
      </div>

      <div className="content">
        <Link href={itemLink}>
          <a className={styles.itemName}>{name}</a>
        </Link>
        <div className="text-gray400">$ {price}</div>
        <button
          type="button"
          onClick={() => addOne!(item)}
          className="uppercase font-bold text-sm sm:hidden"
        >
          Add To Cart
        </button>
      </div>
    </div>
  );
};

export default Card;
