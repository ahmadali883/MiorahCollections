import React from 'react';
import { Link } from 'react-router-dom';
import braceletImg from '../assets/collections/bracelat.JPG';
import necklaceImg from '../assets/collections/necklace.JPG';
import ringsImg from '../assets/collections/rings.JPG';
import earringsImg from '../assets/collections/earrings.JPG';
import pendantImg from '../assets/collections/pendant.JPG';
import handcuffsImg from '../assets/collections/handcuffs.JPG';
import bridalSetImg from '../assets/collections/BridalSet.JPG';

const Categories = () => {
  document.title = "Jewelry Categories - Miorah Collections";

  const categories = [
    {
      name: 'Bracelet',
      image: braceletImg,
      path: '/collections?category=67f0496e4f822be73f76412c'
    },
    {
      name: 'Necklace',
      image: necklaceImg,
      path: '/collections?category=6836f438150daf6600a3a155'
    },
    {
      name: 'Rings',
      image: ringsImg,
      path: '/collections?category=6836f438150daf6600a3a157'
    },
    {
      name: 'Earrings',
      image: earringsImg,
      path: '/collections?category=6836f439150daf6600a3a159'
    },
    {
      name: 'Pendants',
      image: pendantImg,
      path: '/collections?category=6836f439150daf6600a3a15b'
    },
    {
      name: 'Handcuffs',
      image: handcuffsImg,
      path: '/collections?category=6836f43a150daf6600a3a15d'
    },
    {
      name: 'Bridal Sets',
      image: bridalSetImg,
      path: '/collections?category=6836f43a150daf6600a3a15f'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Collections</h1>
          <p className="text-lg text-gray-600">Explore our beautiful jewelry categories</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {/* View All Products Card */}
          <Link
            to="/products"
            className="group block bg-gradient-to-br from-orange to-orange-600 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className="relative overflow-hidden h-64 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM9 8a1 1 0 012 0v4a1 1 0 11-2 0V8z" clipRule="evenodd"/>
                </svg>
                <h3 className="text-2xl font-bold">All Products</h3>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white">
                View All Products
              </h3>
              <p className="text-white opacity-90 mt-2">Browse our complete jewelry collection</p>
            </div>
          </Link>

          {/* Category Cards */}
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className="group block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-orange transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-gray-600 mt-2">Explore our {category.name.toLowerCase()} collection</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories; 