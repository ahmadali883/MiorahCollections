import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getImageUrl } from "../../utils/imageUtils";

const IMAGE_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace('/api', '');

const ProductItem = ({ product, containFilter }) => {
  const navigate = useNavigate();

  const handleNavigation = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/products/${product._id}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={"group relative " + (containFilter ? "block" : "hidden")}
      >
        <div className="w-full min-h-80 bg-grayish-blue aspect-w-1 aspect-h-1 rounded-md overflow-hidden lg:h-80 lg:aspect-none relative before:absolute before:bg-[hsla(222,_4%,_48%,_0.4)] before:inset-0 text-center before:h-0 group-hover:before:h-full before:transition-all">
          {product.images && product.images.length > 0 ? (
            <img
              src={getImageUrl(product.images[0].image_url)}
              alt={product.name}
              className="w-full h-full object-center object-cover sm:h-80 lg:w-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              No Image
            </div>
          )}
        </div>
        <div>
          <div onClick={handleNavigation} className="cursor-pointer">
            <span aria-hidden="true" className="absolute inset-0" />
            <p className="company uppercase text-orange font-bold text-[0.625rem] tracking-wider pb-2 pt-4">
              {product.category_id?.name || "Unknown Category"}
            </p>
            <h3 className="product capitalize text-very-dark-blue text-lg font-bold sm:leading-none pb-4 h-12">
              {product.name}
            </h3>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="price font-bold">Rs. {product.price}</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductItem;
