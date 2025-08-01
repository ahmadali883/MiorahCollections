import React from "react";
import { Link } from "react-router-dom";
// import heroImg from "../../assets/hero-jewellery.png";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Hero = () => {
  document.title = "Miorah Collections";

  const images = [
    "https://res.cloudinary.com/dq43ik06s/image/upload/v1753440669/IMG_5041-removebg-preview_na9t5r.png",
    "https://res.cloudinary.com/dq43ik06s/image/upload/v1753440670/d75176c6-2c4f-4bfa-b318-f7c68e8d4638-removebg-preview_fb4lbj.png",
    "https://res.cloudinary.com/dq43ik06s/image/upload/v1753440669/5f40ba97-0536-4c03-ba0a-84eee14a4711-removebg-preview_gnyitd.png",
    "https://res.cloudinary.com/dq43ik06s/image/upload/v1753440668/9de05c98-41a1-4523-8f5f-0c6820574db8-removebg-preview_rsuyue.png"
  ];
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <AnimatePresence>
      <section
        className="px-5 py-4 lg:py-0 mt-10 flex flex-col lg:flex-row items-center justify-between lg:mx-20 xl:mx-28 2xl:mx-36 3xl:mx-auto lg:px-0 xl:px-3 max-w-xl md:max-w-xl mx-auto lg:max-w-7xl space-y-10 lg:space-y-0"
      >
        <motion.div
          initial={{ opacity: 0, x: "-100%" }}
          animate={{ opacity: 1, x: 0 }}
          id="hero-details"
          className="container order-2 lg:order-1 text-center lg:text-left mx-auto pt-5 sm:pt-10 lg:pt-0 pb-8 lg:pb-5 lg:px-0 xl:mr-1 w-full lg:w-1/2 relative z-[1]"
        >
          <h1 className="capitalize text-very-dark-blue font-bold text-3xl sm:text-4xl lg:text-5xl xl:text-6xl sm:leading-none pb-1 sm:pb-5">
            Elegant Jewellery for Every Occasion
          </h1>
          <p className="text-dark-grayish-blue lg:leading-6 py-6 lg:py-7">
            Discover our stunning collection of artificial jewellery, where timeless elegance meets modern design. 
            From delicate necklaces to statement pieces, find the perfect accessory to complement your style.
          </p>
          {/* Mobile image - appears below text */}
          <div className="block lg:hidden w-full my-6">
            <motion.figure
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              className="hero-img w-full relative"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[current]}
                  src={images[current]}
                  alt="elegant jewellery display"
                  className="w-full h-auto object-cover rounded-lg scale-[1]"
                  initial={{ opacity: 0, rotate: -10 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 10 }}
                  transition={{ duration: 0.7 }}
                />
              </AnimatePresence>
              <div className="absolute w-full h-full bottom-16 sm:bottom-24 -z-10 left-10 sm:left-20">
                <div className="h-inherit">
                  <svg
                    className="w-full scale-[1.2] sm:scale-[1.1] -z-10"
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#FFEDE0"
                      d="M40.7,-68.2C48.9,-65.7,49.1,-47.1,54.7,-33.1C60.4,-19,71.3,-9.5,71,-0.2C70.6,9.1,58.8,18.1,50.1,26.8C41.4,35.5,35.8,43.8,27.9,54.9C20.1,66,10,79.9,0.5,79.1C-9.1,78.3,-18.2,62.8,-27.6,52.6C-37,42.4,-46.7,37.5,-57.4,29.6C-68.1,21.7,-79.8,10.9,-83.4,-2.1C-87.1,-15.1,-82.8,-30.2,-71.9,-37.7C-61,-45.3,-43.6,-45.3,-30.5,-45C-17.4,-44.7,-8.7,-44,3.8,-50.5C16.2,-57.1,32.5,-70.7,40.7,-68.2Z"
                      transform="translate(100 100)"
                    />
                  </svg>
                </div>
              </div>
            </motion.figure>
          </div>
          <Link to="products">
            <button className="w-full h-14 max-w-lg lg:max-w-none bg-orange rounded-lg lg:rounded-xl mt-3 mb-2 text-white flex items-center justify-center lg:w-3/5 hover:bg-white shadow-[inset_0_0_0_0_rgba(255,125,26,0.6)] hover:shadow-[inset_0_-4rem_0_0_rgba(255,125,26,0.6)] transition-all duration-300 mx-auto lg:ml-0 lg:mr-auto">
              Shop Collection
            </button>
          </Link>
        </motion.div>
        {/* Desktop image - side by side */}
        <motion.figure
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          className="hero-img hidden lg:block order-1 lg:order-2 w-full lg:w-1/2 lg:ml-4 relative"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={images[current]}
              src={images[current]}
              alt="elegant jewellery display"
              className="w-full h-auto object-cover rounded-lg scale-[1] lg:scale-[1.3]"
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 10 }}
              transition={{ duration: 0.7 }}
            />
          </AnimatePresence>
          <div className="absolute w-full h-full bottom-16 sm:bottom-24 lg:bottom-24 -z-10 left-10 sm:left-20 lg:left-48">
            <div className="h-inherit">
              <svg
                className="w-full scale-[1.2] sm:scale-[1.1] lg:scale-[1.5] -z-10"
                viewBox="0 0 200 200"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#FFEDE0"
                  d="M40.7,-68.2C48.9,-65.7,49.1,-47.1,54.7,-33.1C60.4,-19,71.3,-9.5,71,-0.2C70.6,9.1,58.8,18.1,50.1,26.8C41.4,35.5,35.8,43.8,27.9,54.9C20.1,66,10,79.9,0.5,79.1C-9.1,78.3,-18.2,62.8,-27.6,52.6C-37,42.4,-46.7,37.5,-57.4,29.6C-68.1,21.7,-79.8,10.9,-83.4,-2.1C-87.1,-15.1,-82.8,-30.2,-71.9,-37.7C-61,-45.3,-43.6,-45.3,-30.5,-45C-17.4,-44.7,-8.7,-44,3.8,-50.5C16.2,-57.1,32.5,-70.7,40.7,-68.2Z"
                  transform="translate(100 100)"
                />
              </svg>
            </div>
          </div>
        </motion.figure>
      </section>
    </AnimatePresence>
  );
};

export default Hero;
