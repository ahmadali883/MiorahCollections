import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { deleteItem, deleteUserCartItem, cartDisplay, emptyCart } from "../redux/reducers/cartSlice";
import { createOrder, createGuestOrder } from "../redux/reducers/orderSlice";
import { createAddress, getUserAddress } from "../redux/reducers/addressSlice";
import { useForm } from "react-hook-form";
import Loading from "../components/Loading";

const Checkout = () => {
  document.title = "Checkout Page";

  const dispatch = useDispatch();
  const { userCartItems, cartItems, amountTotal } = useSelector(
    (state) => state.cart
  );
  const { userInfo, error, userErrorMsg, userToken, loading } = useSelector(
    (state) => state.auth
  );
  const { addresses } = useSelector((state) => state.address);
  const { success: orderSuccess, loading: orderLoading, error: orderError } = useSelector(
    (state) => state.order
  );
  const [formData, setFormData] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    firstname: "",
    lastname: "",
    streetAddress: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    zipcode: ""
  });

  useEffect(() => {
    dispatch(cartDisplay(false));
    // Set default selected address
    if (addresses.length > 0) {
      const defaultAddress = addresses.find(addr => addr.checked) || addresses[0];
      setSelectedAddress(defaultAddress);
    }
    // eslint-disable-next-line
  }, [addresses]);

  // Handle successful order creation
  useEffect(() => {
    if (orderSuccess) {
      setOrderPlaced(true);
      // Clear the cart after successful order
      dispatch(emptyCart());
    }
  }, [orderSuccess, dispatch]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  // Address form validation
  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    reset: resetAddressForm,
  } = useForm();

  const submitForm = (data) => {
    setFormData(data);
    return data;
  };

  const handleDeleteItem = (itemId) => {
    if (userInfo) {
      dispatch(deleteUserCartItem({ itemId, _id: userInfo._id }));
    } else {
      dispatch(deleteItem(itemId));
    }
  };

  const handleSaveAddress = async (data) => {
    if (!userInfo) {
      console.error("User must be logged in to save addresses");
      return;
    }

    try {
      // Prepare address data with user ID
      const addressData = {
        ...data,
        user: userInfo._id
      };

      console.log("Saving address:", addressData);
      
      // Dispatch the createAddress action
      await dispatch(createAddress(addressData)).unwrap();
      
      // Refresh the user's addresses after saving
      await dispatch(getUserAddress({ user: userInfo._id })).unwrap();
      
      // Reset form and hide it
      resetAddressForm();
      setShowAddressForm(false);
      setAddressFormData({
        firstname: "",
        lastname: "",
        streetAddress: "",
        city: "",
        state: "",
        country: "",
        phone: "",
        zipcode: ""
      });
      
      console.log("Address saved successfully!");
    } catch (error) {
      console.error("Failed to save address:", error);
      // You could show an error message to the user here
    }
  };

  const handleAddressSelection = (address) => {
    setSelectedAddress(address);
  };

  const handlePlaceOrder = () => {
    if (!canPlaceOrder()) {
      // The validation message is already shown in the UI, no need for alert
      return;
    }

    // For guest users, get the current form values
    const currentFormData = !userInfo ? watch() : null;

    // Prepare order data in the format expected by backend
    const orderData = {
      user: userInfo ? userInfo._id : null,
      products: userInfo ? userCartItems : cartItems,
      amount: amountTotal + (amountTotal >= 2000 ? 0 : 200),
      address: userInfo ? selectedAddress : currentFormData,
      paymentID: "COD_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9) // Generate unique ID for Cash on Delivery
    };

    console.log("Placing order:", orderData);
    
    // Create the order (this will trigger email sending)
    if (userInfo) {
      // For logged-in users
      dispatch(createOrder(orderData));
    } else {
      // For guest users - create a guest order
      dispatch(createGuestOrder(orderData));
    }
  };

  const canPlaceOrder = () => {
    const hasItems = userInfo ? userCartItems?.length > 0 : cartItems?.length > 0;
    
    // For guest users, check if form data has required fields
    if (!userInfo) {
      const watchedValues = watch(); // Watch all form values in real-time
      const requiredFields = ['firstname', 'lastname', 'phone', 'email', 'address', 'city', 'state', 'zipcode'];
      const hasAllRequiredFields = requiredFields.every(field => 
        watchedValues[field] && watchedValues[field].toString().trim() !== ''
      );
      return hasItems && hasAllRequiredFields && !orderPlaced;
    }
    
    // For logged-in users, just need items and address
    const hasAddress = selectedAddress;
    return hasItems && hasAddress && !orderPlaced;
  };

  const getValidationMessage = () => {
    const hasItems = userInfo ? userCartItems?.length > 0 : cartItems?.length > 0;

    if (!hasItems) {
      return "Add items to your cart to place an order";
    }

    if (!userInfo) {
      // For guest users, check if form data has required fields using watched values
      const watchedValues = watch(); // Watch all form values in real-time
      
      const requiredFields = [
        { field: 'firstname', label: 'First Name' },
        { field: 'lastname', label: 'Last Name' },
        { field: 'phone', label: 'Phone Number' },
        { field: 'email', label: 'Email Address' },
        { field: 'address', label: 'Address' },
        { field: 'city', label: 'City' },
        { field: 'state', label: 'State' },
        { field: 'zipcode', label: 'Postal Code' }
      ];
      
      const missingFields = requiredFields.filter(({ field }) => 
        !watchedValues[field] || watchedValues[field].toString().trim() === ''
      );
      
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(({ label }) => label).join(', ');
        return `Please fill in the following required fields: ${fieldNames}`;
      }
    } else {
      // For logged-in users
      const hasAddress = selectedAddress;
      if (!hasAddress) {
        return "Please select or add a delivery address";
      }
    }

    if (orderPlaced) {
      return "Order has been placed successfully";
    }
    return null;
  };

  return (
    <div className="bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-2xl mx-auto lg:max-w-none">
          <h2 className="sr-only">Checkout</h2>

          <div className="relative flex flex-col lg:flex-row lg:gap-x-12 xl:gap-x-16">
            <div className="order-2 lg:order-1 bg-white mt-4 border border-gray-200 rounded-lg shadow-sm p-6 lg:w-3/5 py-16 h-fit">
              {userToken && (
                <>
                  {!error ? (
                    <>
                      {loading && (
                        <div className=" w-full h-full flex items-center justify-center">
                          <Loading />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="absolute text-sm text-center text-[red] -top-4 left-0">
                      {userErrorMsg}. Please reload page
                    </p>
                  )}
                </>
              )}
              {!userInfo ? (
                <form onSubmit={handleSubmit(submitForm)}>
                  <div>
                    <div className="flex flex-wrap justify-between text-dark-grayish-blue">
                      <h3 className="text-lg font-bold text-very-dark-blue">
                        Customer Details
                      </h3>

                      <Link to="/login">
                        <p className="text-sm border-b border-b-orange">
                          <span aria-hidden="true">
                            Already have an account?
                          </span>
                          <span className="sr-only">
                            Already have an account?
                          </span>
                          {""} Log in
                        </p>
                      </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                      <div className="relative mt-5 w-full">
                        <input
                          id="firstname"
                          name="firstname"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="First Name"
                          {...register("firstname", {
                            required: "Please enter your first name",
                          })}
                        />
                        {errors.firstname && (
                          <p className="text-sm text-[red] italic">
                            {errors.firstname.message}
                          </p>
                        )}
                        <label
                          htmlFor="firstname"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          First Name <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          id="lastname"
                          name="lastname"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="Last Name"
                          {...register("lastname", {
                            required: "Please enter your last name",
                          })}
                        />
                        {errors.lastname && (
                          <p className="text-sm text-[red] italic">
                            {errors.lastname.message}
                          </p>
                        )}
                        <label
                          htmlFor="lastname"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Last Name <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          id="number"
                          name="number"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="number"
                          {...register("phone", {
                            required: "Please enter your phone number",
                          })}
                        />
                        {errors.phone && (
                          <p className="text-sm text-[red] italic">
                            {errors.phone.message}
                          </p>
                        )}
                        <label
                          htmlFor="number"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          autoComplete="email"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="email"
                          {...register("email", {
                            required: "Please enter your email",
                          })}
                        />
                        {errors.email && (
                          <p className="text-sm text-[red] italic">
                            {errors.email.message}
                          </p>
                        )}
                        <label
                          htmlFor="email"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Email address <span className="text-red-500">*</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 border-t border-gray-200 pt-10">
                    <h3 className="text-lg font-bold text-very-dark-blue">
                      Shipping information
                    </h3>

                    <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                      <div className="sm:col-span-2 relative mt-5 w-full">
                        <input
                          id="address"
                          name="address"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="address"
                          {...register("address", {
                            required: "Please enter your address",
                          })}
                        />
                        {errors.address && (
                          <p className="text-sm text-[red] italic">
                            {errors.address.message}
                          </p>
                        )}
                        <label
                          htmlFor="address"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Address <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="sm:col-span-2 relative mt-5 w-full">
                        <input
                          id="apartment"
                          name="apartment"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="Apartment, suite, etc. (optional)"
                          {...register("apartment")}
                        />
                        <label
                          htmlFor="apartment"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Apartment, suite, etc. (optional)
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          id="city"
                          name="city"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="city"
                          {...register("city", {
                            required: "Please enter your city",
                          })}
                        />
                        {errors.city && (
                          <p className="text-sm text-[red] italic">
                            {errors.city.message}
                          </p>
                        )}
                        <label
                          htmlFor="city"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          City <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          id="state"
                          name="state"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="state"
                          {...register("state", {
                            required: "Please enter your state",
                          })}
                        />
                        {errors.state && (
                          <p className="text-sm text-[red] italic">
                            {errors.state.message}
                          </p>
                        )}
                        <label
                          htmlFor="state"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          State / Province <span className="text-red-500">*</span>
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          id="country"
                          name="country"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="country"
                          {...register("country")}
                        />
                        <label
                          htmlFor="country"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Country
                        </label>
                      </div>
                      <div className="relative mt-5 w-full">
                        <input
                          id="zipcode"
                          name="zipcode"
                          type="text"
                          className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                          placeholder="zip-code"
                          {...register("zipcode", {
                            required: "Please enter your zipcode",
                          })}
                        />
                        {errors.zipcode && (
                          <p className="text-sm text-[red] italic">
                            {errors.zipcode.message}
                          </p>
                        )}
                        <label
                          htmlFor="zipcode"
                          className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                        >
                          Postal code <span className="text-red-500">*</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 py-6 flex">
                    <div className="w-full lg:w-60 lg:ml-auto bg-blue-50 border border-blue-200 rounded-md py-3 px-4 text-center">
                      <p className="text-blue-800 font-medium">💡 Quick Tip</p>
                      <p className="text-blue-600 text-sm mt-1">You can place orders as a guest, or <Link to="/login" className="underline hover:text-blue-800">login</Link> to track your orders.</p>
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="flex flex-wrap justify-between text-dark-grayish-blue mb-4">
                    <h3 className="text-lg font-bold text-very-dark-blue">
                      Delivery Information
                    </h3>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="text-sm border-b border-b-orange hover:border-b-transparent transition-all"
                    >
                      {showAddressForm ? 'Hide Address Form' : 'Add New Address'}
                    </button>
                  </div>

                  {/* Address Form for logged-in users */}
                  {showAddressForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="text-md font-semibold text-very-dark-blue mb-3">
                        Add New Address
                      </h4>
                      <form onSubmit={handleAddressSubmit(handleSaveAddress)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="First Name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("firstname", { required: "First name is required" })}
                          />
                          {addressErrors.firstname && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.firstname.message}</p>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Last Name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("lastname", { required: "Last name is required" })}
                          />
                          {addressErrors.lastname && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.lastname.message}</p>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Street Address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("streetAddress", { required: "Street address is required" })}
                          />
                          {addressErrors.streetAddress && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.streetAddress.message}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="City"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("city", { required: "City is required" })}
                          />
                          {addressErrors.city && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.city.message}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="State"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("state", { required: "State is required" })}
                          />
                          {addressErrors.state && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.state.message}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Country"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("country", { required: "Country is required" })}
                          />
                          {addressErrors.country && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.country.message}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("phone", { required: "Phone is required" })}
                          />
                          {addressErrors.phone && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.phone.message}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Zip Code"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-orange"
                            {...registerAddress("zipcode", { required: "Zip code is required" })}
                          />
                          {addressErrors.zipcode && (
                            <p className="text-sm text-red-500 mt-1">{addressErrors.zipcode.message}</p>
                          )}
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-orange text-white rounded-md hover:opacity-90"
                          >
                            Save Address
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddressForm(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="border-t border-gray-200">
                    {addresses.length > 0 ? (
                      <div className="mt-6">
                        <h4 className="text-md font-semibold text-very-dark-blue mb-3">
                          Select Delivery Address
                        </h4>
                        <div className="space-y-3">
                          {addresses.map((address) => (
                            <div
                              key={address._id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedAddress?._id === address._id
                                  ? 'border-orange bg-orange-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => handleAddressSelection(address)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="text-dark-grayish-blue">
                                  <p className="text-very-dark-blue font-medium">
                                    {address.firstname} {address.lastname}
                                  </p>
                                  <p className="">{address.streetAddress}</p>
                                  <p className="">
                                    {address.city}, {address.state} {address.zipcode}
                                  </p>
                                  <p className="">{address.country}</p>
                                  <p className="">{address.phone}</p>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  selectedAddress?._id === address._id
                                    ? 'border-orange bg-orange'
                                    : 'border-gray-300'
                                }`}>
                                  {selectedAddress?._id === address._id && (
                                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <p className="text-gray-500 mb-4">No addresses saved. Please add an address to continue.</p>
                        <button
                          onClick={() => setShowAddressForm(true)}
                          className="w-fit px-4 py-2 bg-orange text-white rounded-md hover:opacity-90 transition-all"
                        >
                          Add An Address
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {((userInfo && (addresses.length > 0 || showAddressForm)) || !userInfo) && (
                <div className="payment mt-12">
                  <h3 className="text-lg font-bold text-very-dark-blue pb-4 mb-6 border-b border-gray-200">
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h4 className="text-md font-semibold mb-2">Cash on Delivery</h4>
                    <p className="text-dark-grayish-blue text-sm">
                      You will pay for your order in cash when it is delivered to your address.
                    </p>
                  </div>
                  
                  {/* Place Order Button */}
                  <div className="mt-8">
                    {/* Validation Notice */}
                    {!canPlaceOrder() && !orderPlaced && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-amber-800 font-semibold">Required Information Missing</h4>
                            <p className="text-amber-700 text-sm">{getValidationMessage()}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {orderError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-red-800 font-semibold">Order Failed</h4>
                            <p className="text-red-700 text-sm">There was an error placing your order. Please try again.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {orderPlaced ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-green-800 font-semibold">Order Placed Successfully!</h4>
                            <p className="text-green-700 text-sm">Thank you for your order. You will receive a confirmation email shortly.</p>
                            <div className="mt-3">
                              <Link to="/user-profile/orders">
                                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm">
                                  View My Orders
                                </button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handlePlaceOrder}
                        disabled={!canPlaceOrder() || orderLoading}
                        className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
                          canPlaceOrder() && !orderLoading
                            ? 'bg-orange text-white hover:opacity-90 shadow-[inset_0_0_0_0_#ffede1] hover:shadow-[inset_0_-4rem_0_0_#ffede1] hover:text-orange'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {orderLoading ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Placing Order...
                          </span>
                        ) : canPlaceOrder() ? (
                          `Place Order - Rs ${(amountTotal + (amountTotal >= 2000 ? 0 : 200)).toFixed(2)}`
                        ) : (
                          'Complete Required Information'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* <!-- Order summary --> */}
            <div className="order-1 lg:order-2 flex-1 w-auto mt-16 sm:mt-10 lg:mt-4">
              <h3 className="text-lg font-bold text-very-dark-blue">
                Order summary
              </h3>
              <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <h4 className="sr-only">Items in your cart</h4>
                <ul className="divide-y divide-gray-200">
                  {(userInfo ? userCartItems : cartItems).map((item) => (
                    <li
                      key={item.id}
                      className="item w-full flex items-center justify-between text-grayish-blue pb-5"
                    >
                      {item.product.images && item.product.images.length > 0 ? (
                        <img
                          src={
                            item.product.images[0].image_url?.startsWith('/uploads/')
                              ? process.env.REACT_APP_API_BASE_URL.replace('/api', '') + item.product.images[0].image_url
                              : process.env.REACT_APP_API_BASE_URL.replace('/api', '') + '/uploads/products/' + item.product.images[0].image_url
                          }
                          alt="product-img"
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-lg">
                          <span className="text-xs text-gray-500">No image</span>
                        </div>
                      )}
                      <div className="pl-3 flex-1">
                        <div className="flex justify-between">
                          <p className="product capitalize font-bold text-md text-dark-grayish-blue">
                            <Link
                              to={`/products/${item.product._id}`}
                              className="cursor-pointer hover:opacity-70 transition"
                            >
                              {item.product.name || item.product.title}
                            </Link>
                          </p>
                          <div className="delete pl-2">
                            <i
                              onClick={() => handleDeleteItem(item.id)}
                              className="cursor-pointer hover:text-red-500 transition-all"
                              title="Remove item"
                            >
                              <ion-icon name="trash-outline"></ion-icon>
                            </i>
                          </div>
                        </div>
                        <div className="price flex justify-between">
                          <span className="">
                            Rs {item.product.price} x {item.quantity}
                          </span>
                          <span className="font-medium text-very-dark-blue">
                            Rs {item.itemTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="border-t border-gray-200 py-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Subtotal</dt>
                    <dd className="text-sm font-medium text-very-dark-blue">
                      Rs {amountTotal.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-sm">Shipping</dt>
                    <dd className="text-sm font-medium text-very-dark-blue">
                      {amountTotal >= 2000 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        "Rs 200.00"
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-200 pt-6 font-bold">
                    <dt className="">Total</dt>
                    <dd className="">Rs {(amountTotal + (amountTotal >= 2000 ? 0 : 200)).toFixed(2)}</dd>
                  </div>
                </dl>
                {amountTotal < 2000 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Free Shipping:</strong> Get free shipping on orders over Rs 2,000!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
