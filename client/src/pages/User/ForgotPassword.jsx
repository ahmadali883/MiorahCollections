import React, { useState } from "react";
import AuthBg from "../../assets/user/auth-bg.jpg";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "../../utils/axiosConfig";
import ErrorDisplay from "../../components/ErrorDisplay";

const ForgotPassword = () => {
  document.title = "Forgot Password";
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm();

  const submitForm = async (data) => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      const response = await axios.post("/auth/forgot-password", data);
      setMessage(response.data.message || "Password reset instructions sent to your email");
    } catch (err) {
      // Enhanced error handling
      let errorMessage = "An error occurred. Please try again.";
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.msg || "Please check your email address.";
      } else if (err.response?.status === 429) {
        errorMessage = "Too many requests. Please try again later.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (!err.response) {
        errorMessage = "Network error. Please check your connection.";
      }
      
      setError({
        msg: errorMessage,
        status: err.response?.status,
        type: 'FORGOT_PASSWORD_ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError("");
    setMessage("");
    // Focus on email field
    const emailField = document.getElementById('email');
    if (emailField) emailField.focus();
  };

  return (
    <div className="relative h-screen">
      <div className="bg-pale-orange absolute inset-0 h-full w-full -z-20">
        <img
          src={AuthBg}
          alt="background of sneakers on a wooden board"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      </div>
      <div className="wrapper w-full min-h-screen py-12 sm:py-8 flex items-center justify-center">
        <div className="wrapper w-5/6 sm:w-3/4 md:w-3/5 xl:w-2/5 container py-16 px-8 sm:px-12 bg-white relative">
          <h1 className="title text-xl sm:text-2xl lg:text-3xl font-bold text-very-dark-blue mb-6">
            FORGOT PASSWORD
          </h1>
          <p className="text-dark-grayish-blue mb-8">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
          
          <form
            className="flex flex-wrap justify-between w-full"
            onSubmit={handleSubmit(submitForm)}
          >
            {error && (
              <div className="absolute top-32 left-0 right-0 z-10">
                <ErrorDisplay 
                  error={error}
                  onRetry={handleRetry}
                  onDismiss={() => setError("")}
                  size="small"
                  className="mx-0"
                />
              </div>
            )}
            {message && (
              <div className="absolute top-32 left-0 right-0 z-10">
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800">{message}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative w-full mb-6 py-3">
              <input
                id="email"
                name="email"
                type="email"
                className="peer h-10 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange"
                placeholder="Email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Please enter a valid email address",
                  },
                })}
              />
              <label
                htmlFor="email"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Email Address
              </label>
              {errors.email && (
                <p className="text-sm text-[red] italic mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={
                "w-full h-12 max-w-lg lg:max-w-none bg-orange rounded-md mt-3 mb-6 text-white flex items-center justify-center lg:w-2/5 border border-orange shadow-[inset_0_0_0_0_#ffede1] hover:shadow-[inset_0_-4rem_0_0_#ffede1] hover:text-orange transition-all duration-300 " +
                (loading ? "cursor-not-allowed opacity-50" : "cursor-pointer")
              }
            >
              {loading ? (
                <div
                  className="spinner-border animate-spin inline-block w-4 h-4 border rounded-full"
                  role="status"
                >
                  <span className="sr-only">Loading...</span>
                </div>
              ) : (
                "SEND RESET INSTRUCTIONS"
              )}
            </button>
            
            <div className="links mt-6 flex flex-wrap justify-center w-full">
              <NavLink
                to="/login"
                className="border-b-2 border-solid border-transparent hover:border-orange transition-color"
              >
                Back to Login
              </NavLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 