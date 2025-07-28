import React from "react";
import star from "../../assets/star.svg";
import truck from "../../assets/truck-fast.svg";
import hand from "../../assets/hand-holding-dollar.svg";

const Benefits = () => {
  return (
    <section className="lg:mx-20 xl:mx-28 2xl:mx-36  3xl:mx-auto lg:px-0 xl:px-3 max-w-xl mx-auto lg:max-w-7xl mb-12 lg:mb-16 lg:mt-7">
      <h2 className="text-very-dark-blue font-bold w-fit border-t text-2xl text-center mx-auto lg:mx-0 lg:text-left sm:text-4xl sm:leading-none py-6 sm:pb-5 mb-6 lg:mb-9">
        Benefits
      </h2>
      <div
        id="benefits"
        className="flex flex-col lg:flex-row items-center justify-center"
      >
        <div className="detail px-4 mb-10 flex flex-col items-center text-center lg:text-left lg:items-start">
          <figure className="bg-pale-orange rounded-full w-12 h-12 flex flex-col lg:flex-row items-center justify-center">
            <img src={truck} alt="truck" className="w-7" />
          </figure>
          <h3 className="text-very-dark-blue font-bold text-xl pt-5 pb-4">
            Fast Delivery
          </h3>
          <p className="text-grayish-blue text-base">
            Get your jewellery as quickly as possible. Keep track of your deliveries
            and enjoy our fast shipping right at your doorstep.
          </p>
        </div>
        <div className="detail px-4 mb-10 flex flex-col items-center text-center lg:text-left lg:items-start">
          <figure className="bg-pale-orange rounded-full w-12 h-12 flex items-center justify-center">
            <img src={hand} alt="hand holding dollar" className="w-7 mb-1" />
          </figure>
          <h3 className="text-very-dark-blue font-bold text-xl pt-5 pb-4">
            Affordable Luxury
          </h3>
          <p className="text-grayish-blue text-base">
            Our artificial jewellery is crafted with premium materials at affordable prices. No
            hidden costs. No additional fees required other than what's stated.
          </p>
        </div>
        <div className="detail px-4 mb-10 flex flex-col items-center text-center lg:text-left lg:items-start">
          <figure className="bg-pale-orange rounded-full w-12 h-12 flex items-center justify-center">
            <img src={star} alt="star icon" className="w-7" />
          </figure>
          <h3 className="text-very-dark-blue font-bold text-xl pt-5 pb-4">
            Premium Quality
          </h3>
          <p className="text-grayish-blue text-base">
            From classic designs to the latest trends, we offer jewellery pieces crafted
            with the finest materials and exquisite attention to detail.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
