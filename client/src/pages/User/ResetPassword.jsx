import React, { useState, useEffect } from "react";
import AuthBg from "../../assets/user/auth-bg.jpg";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "../../utils/axiosConfig";
import ErrorDisplay from "../../components/ErrorDisplay";
import api from "../../config/api";

const ResetPassword = () => {
  document.title = "Reset Password";
  
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tokenValid, setTokenValid] = useState(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    getValues 
  } = useForm();

  const watchedPassword = watch("password");

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError({
        msg: "Invalid reset link. Please request a new password reset.",
        type: 'INVALID_TOKEN'
      });
      setTokenValid(false);
      return;
    }

    // Token format validation (should be 64 hex characters)
    const tokenRegex = /^[a-f0-9]{64}$/i;
    if (!tokenRegex.test(token)) {
      setError({
        msg: "Invalid reset token format. Please request a new password reset.",
        type: 'INVALID_TOKEN'
      });
      setTokenValid(false);
      return;
    }

    setTokenValid(true);
  }, [token]);

  const submitForm = async (data) => {
    setLoading(true);
    setError("");
    setMessage("");
    
    try {
      // const response = await axios.post("/auth/reset-password", {
      const response = await api.post("/auth/reset-password", {
        token,
        password: data.password
      });
      
      setMessage("Password has been reset successfully! Redirecting to login...");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Password reset successful! Please login with your new password.",
            type: "success"
          }
        });
      }, 3000);
      
    } catch (err) {
      // Enhanced error handling
      let errorMessage = "An error occurred. Please try again.";
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.msg || "Invalid or expired reset token.";
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
        type: 'RESET_PASSWORD_ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError("");
    setMessage("");
    // Focus on password field
    const passwordField = document.getElementById('password');
    if (passwordField) passwordField.focus();
  };

  // Don't render form if token is invalid
  if (tokenValid === false) {
    return (
      <div className="relative h-screen">
        <div className="bg-pale-orange absolute inset-0 h-full w-full -z-20">
          <img
            src={AuthBg}
            alt="background"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        </div>
        <div className="wrapper w-full min-h-screen py-12 sm:py-8 flex items-center justify-center">
          <div className="wrapper w-5/6 sm:w-3/4 md:w-3/5 xl:w-2/5 container py-16 px-8 sm:px-12 bg-white relative">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="title text-xl sm:text-2xl lg:text-3xl font-bold text-very-dark-blue mb-4">
                Invalid Reset Link
              </h1>
              {error && (
                <ErrorDisplay 
                  error={error}
                  onDismiss={() => setError("")}
                  showRetry={false}
                  className="mb-6"
                />
              )}
              <div className="space-y-4">
                <NavLink
                  to="/forgot-password"
                  className="block w-full bg-orange text-white py-3 px-6 rounded-md hover:bg-orange-600 transition-colors"
                >
                  Request New Reset Link
                </NavLink>
                <NavLink
                  to="/login"
                  className="block w-full bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Back to Login
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <div className="bg-pale-orange absolute inset-0 h-full w-full -z-20">
        <img
          src={AuthBg}
          alt="background"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      </div>
      <div className="wrapper w-full min-h-screen py-12 sm:py-8 flex items-center justify-center">
        <div className="wrapper w-5/6 sm:w-3/4 md:w-3/5 xl:w-2/5 container py-16 px-8 sm:px-12 bg-white relative">
          <h1 className="title text-xl sm:text-2xl lg:text-3xl font-bold text-very-dark-blue mb-6">
            RESET PASSWORD
          </h1>
          <p className="text-dark-grayish-blue mb-8">
            Enter your new password below. Make sure it's strong and secure.
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
                id="password"
                name="password"
                type="password"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="New Password"
                {...register("password", {
                  required: "Please enter a new password",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message: "Password must contain at least one letter and one number",
                  },
                })}
                aria-label="New Password"
                aria-describedby="password-error"
                autoComplete="new-password"
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                New Password
              </label>
              {errors.password && (
                <p id="password-error" className="text-sm text-[red] italic mt-1" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
            
            <div className="relative w-full mb-6 py-3">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="Confirm New Password"
                {...register("confirmPassword", {
                  required: "Please confirm your new password",
                  validate: (value) => {
                    const { password } = getValues();
                    return password === value || "Passwords do not match";
                  },
                })}
                aria-label="Confirm New Password"
                aria-describedby="confirm-password-error"
                autoComplete="new-password"
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Confirm New Password
              </label>
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-[red] italic mt-1" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Password strength indicator */}
            {watchedPassword && (
              <div className="w-full mb-4">
                <div className="text-sm text-gray-600 mb-2">Password strength:</div>
                <div className="flex space-x-1 mb-2">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-2 flex-1 rounded ${
                        getPasswordStrength(watchedPassword) >= level
                          ? getPasswordStrength(watchedPassword) === 1
                            ? 'bg-red-500'
                            : getPasswordStrength(watchedPassword) === 2
                            ? 'bg-yellow-500'
                            : getPasswordStrength(watchedPassword) === 3
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {getPasswordStrengthText(watchedPassword)}
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || message}
              className={
                "w-full h-12 max-w-lg lg:max-w-none bg-orange rounded-md mt-3 mb-6 text-white flex items-center justify-center lg:w-2/5 border border-orange shadow-[inset_0_0_0_0_#ffede1] hover:shadow-[inset_0_-4rem_0_0_#ffede1] hover:text-orange transition-all duration-300 " +
                (loading || message ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90")
              }
            >
              {loading ? (
                <div className="flex items-center">
                  <div
                    className="spinner-border animate-spin inline-block w-4 h-4 border rounded-full mr-2"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  RESETTING PASSWORD...
                </div>
              ) : message ? (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  SUCCESS
                </div>
              ) : (
                "RESET PASSWORD"
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

// Password strength calculation
const getPasswordStrength = (password) => {
  if (!password) return 0;
  
  let strength = 0;
  
  // Length check
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  
  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return Math.min(strength, 4);
};

const getPasswordStrengthText = (password) => {
  const strength = getPasswordStrength(password);
  
  switch (strength) {
    case 0:
    case 1:
      return "Weak - Add more characters and variety";
    case 2:
      return "Fair - Consider adding numbers or symbols";
    case 3:
      return "Good - Strong password";
    case 4:
      return "Excellent - Very strong password";
    default:
      return "";
  }
};

export default ResetPassword; 