import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getFilters,
  selectFilters,
  selectSort,
  getCategories
} from "../redux/reducers/productSlice";

const Filter = () => {
  const dispatch = useDispatch();
  const filter = useSelector((state) => state.product.filter);
  const loading = useSelector((state) => state.product.loading);
  const colors = useSelector((state) => state.product.colors);
  const categories = useSelector((state) => state.product.categories);
  const filteredProducts = useSelector(
    (state) => state.product.filteredProducts
  );

  useEffect(() => {
    if (!loading) {
      dispatch(getFilters());
      // Only fetch categories if we don't have any yet
      if (categories.length === 0) {
        dispatch(getCategories());
      }
    }
    // eslint-disable-next-line
  }, [loading]); // Changed dependency from filteredProducts to just loading

  const handleFilter = (e) => {
    dispatch(
      selectFilters({ filter: { ...filter, [e.target.name]: e.target.value } })
    );
  };

  const handleSort = (e) => {
    dispatch(selectSort({ sort: e.target.value }));

    // REFILTER AFTER SORTED
    dispatch(selectFilters({ filter: { ...filter } }));
  };

  return (
    <div className="wrapper mt-28 lg:mt-40 flex flex-col sm:flex-row justify-between mx-auto sm">
      <div className="filter-container mb-4 sm:mb-0 flex items-center justify-between sm:mr-8">
        <span className="font-bold text-base md:text-xl mr-2 sm:mr-10">
          Filter Products:
        </span>
        <div className="flex">
          <select
            className="appearance-none px-3 py-2 border border-solid transition ease-in-out m-0 focus:outline-none mr-4 bg-white"
            aria-label="Default color select"
            name="color"
            onChange={handleFilter}
            value={filter.color}
          >
            <option value="">Color</option>
            {colors.map((color, index) => (
              <option key={index} value={color}>
                {color}
              </option>
            ))}
          </select>
          <select
            className="appearance-none px-3 py-2 border border-solid transition ease-in-out m-0 focus:outline-none capitalize bg-white"
            aria-label="Default category select"
            name="category"
            onChange={handleFilter}
            value={filter.category}
          >
            <option value="">Category</option>
            {categories.map((category, index) => (
              // Check if category is a string or an object
              <option key={index} value={typeof category === 'object' ? category.name : category}>
                {typeof category === 'object' ? category.name : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="sort-container flex items-center justify-between">
        <span className="font-bold md:text-xl mr-2 sm:mr-10">
          Sort Products:
        </span>
        <select
          className="appearance-none px-3 py-2 border border-solid transition ease-in-out m-0 focus:outline-none bg-white"
          aria-label="Default sorting select"
          name="sortBy"
          onChange={handleSort}
        >
          <option value="newest">Newest</option>
          <option value="asc">Price, low-high</option>
          <option value="desc">Price, high-low</option>
        </select>
      </div>
    </div>
  );
};

export default Filter;
