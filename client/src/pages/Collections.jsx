import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProductsByCollection } from '../redux/reducers/productSlice';
import ProductItem from '../components/home/ProductItem';
import Loading from '../components/Loading';
import CollectionsHeader from '../assets/page-header/collections-header.jpg';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Collections = () => {
  document.title = "Jewellery Collections"
  const query = useQuery();
  const categoryId = query.get('category');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { collection, loading, error, errMsg, categories } = useSelector(state => state.product);

  // Map category IDs to names for display
  const categoryIdToName = {
    '67f0496e4f822be73f76412c': 'Bracelet',
    '6836f438150daf6600a3a155': 'Necklace',
    '6836f438150daf6600a3a157': 'Rings',
    '6836f439150daf6600a3a159': 'Earrings',
    '6836f439150daf6600a3a15b': 'Pendants',
    '6836f43a150daf6600a3a15d': 'Handcuffs',
    '6836f43a150daf6600a3a15f': 'Bridal Sets'
  };

  const categoryName = categoryId ? categoryIdToName[categoryId] : null;

  useEffect(() => {
    if (categoryId) {
      dispatch(getProductsByCollection(categoryId));
    } else {
      // If no category is selected, redirect to categories page
      navigate('/categories');
    }
  }, [categoryId, dispatch, navigate]);

  return (
    <section className='h-auto lg:pt-2 min-h-[80vh]'>
      <div className='max-w-xl sm:max-w-4xl lg:max-w-7xl relative px-5 pt-20 pb-12 items-center mx-auto lg:mx-20 xl:mx-28 2xl:mx-40 3xl:mx-auto lg:pb-2 lg:px-1 xl:px-3 2xl:px-1'>
        {/* Breadcrumb Navigation */}
        {categoryId && (
          <nav className="relative z-[2] mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/" className="text-gray-600 hover:text-orange transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link to="/categories" className="text-gray-600 hover:text-orange transition-colors">
                  Categories
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-orange font-medium">
                {categoryName}
              </li>
            </ol>
          </nav>
        )}
        
        <h2 className='product capitalize text-white font-bold text-center relative z-[1] lg:text-left text-3xl sm:text-4xl sm:leading-none pb-16 px-8'>
          {categoryName ? `${categoryName} Collection` : 'Our Collections'}
        </h2>
        <div className='absolute top-0 left-0 -z-0 bg-dark-grayish-blue w-full h-48 lg:rounded-md overflow-hidden'>
          <img
            src={CollectionsHeader}
            alt='jewelry collections header'
            className='opacity-10 h-full w-full object-cover'
          />
        </div>
        {categoryId ? (
          loading ? (
            <Loading />
          ) : error ? (
            <p className="mt-20 text-center text-very-dark-blue">{errMsg || 'Failed to load products.'}</p>
          ) : (
            <div className="grid grid-cols-1 gap-y-12 sm:y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8 mt-12">
              {collection.length === 0 ? (
                <p className="col-span-full text-center text-gray-500">No products found in this category.</p>
              ) : (
                collection.map((product, index) => (
                  <ProductItem key={product._id} product={product} containFilter={true} />
                ))
              )}
            </div>
          )
        ) : (
          // If no category is selected, show the category cards
          <div className="mt-12">
            {/* You can import and use your CollectionsCards component here if you want to show categories */}
            <p className="text-center text-gray-500">Please select a category to view products.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Collections;
