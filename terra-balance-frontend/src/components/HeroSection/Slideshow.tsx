import Image from "next/image";
import TextButton from "../Buttons/TextButton";
import styles from "./Hero.module.css";

// swiperjs
import { Swiper, SwiperSlide } from "swiper/react";
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

// import Swiper core and required modules
import { Autoplay, Navigation, Pagination } from "swiper/modules";


const sliders = [
    {
      id: 2,
      image: "/images/banner.jpg",
      imageTablet: "/images/banner-tablet.png",
      imageMobile: "/images/banner-mobile.png",
      subtitle: "50% off",
      titleUp: "New Fruits & Vegetables",
      titleDown: "Fruits",
      rightText: false,
    },
    {
      id: 1,
      image: "/images/banner2.jpg",
      imageTablet: "/images/banner2-tablet.png",
      imageMobile: "/images/banner2-mobile.png",
      subtitle: "Spring Revolution",
      titleUp: "Fresh Produce",
      titleDown: "Food",
      rightText: true,
    },
    {
      id: 3,
      image: "/images/banner3.jpg",
      imageTablet: "/images/banner3-tablet.png",
      imageMobile: "/images/banner3-mobile.png",
      subtitle: "Spring promo",
      titleUp: "The Animal Husbandry",
      titleDown: "Promotions",
      rightText: false,
    },
    // {
    //   id: 4,
    //   image: "/images/banner2.jpg",
    //   imageTablet: "/images/curly_hair_white-1-tablet.png",
    //   imageMobile: "/images/curly_hair_white-1_mobile.png",
    //   subtitle: "Spring Revolution",
    //   titleUp: "Fresh Produce",
    //   titleDown: "Food",
    //   rightText: true,
    // },
  ];

const Slideshow = () => {

  return (
    <>
      <div className="relative -top-20 slide-container w-full z-20">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          spaceBetween={0}
          loop={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          // navigation={true}
          // pagination={{
          //   clickable: true,
          //   // type: "fraction",
          //   dynamicBullets: true,
          // }}
          className="mySwiper"
        >
          {sliders.map((slider) => (
            <SwiperSlide key={slider.id}>
              <div className="hidden lg:block">
                <Image
                  layout="responsive"
                  src={slider.image}
                  width={1144}
                  height={572}
                  alt={"some name"}
                />
              </div>
              <div className="hidden sm:block lg:hidden">
                <Image
                  layout="responsive"
                  src={slider.imageTablet}
                  width={820}
                  height={720}
                  alt={"some name"}
                />
              </div>
              <div className="sm:hidden">
                <Image
                  layout="responsive"
                  src={slider.imageMobile}
                  width={428}
                  height={800}
                  alt={"some name"}
                />
              </div>
              <div
                className={
                  slider.rightText
                    ? styles.rightTextSection
                    : styles.leftTextSection
                }
              >
                <span className={styles.subtitle}>{slider.subtitle}</span>
                <span
                  className={`${styles.title} text-center ${
                    slider.rightText ? "sm:text-right" : "sm:text-left"
                  }`}
                >
                  {slider.titleUp} <br />
                  {slider.titleDown}
                </span>
                <TextButton value={("Shop now")} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
};

export default Slideshow;