import React, { useEffect, useState } from "react";
import AuthBg from "../../assets/user/auth-bg.jpg";
import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { loginUser, removeError } from "../../redux/reducers/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import ErrorDisplay from "../../components/ErrorDisplay";
import axios from "../../utils/axiosConfig";

const Login = () => {
  document.title = "Login Page";

  const { loading, userInfo, error, errMsg } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(null);
  const [emailVerificationError, setEmailVerificationError] = useState(null);
  const [resendState, setResendState] = useState({
    loading: false,
    success: false,
    error: null
  });

  // Handle success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    
    // Handle query parameters for messages
    const urlParams = new URLSearchParams(location.search);
    const queryMessage = urlParams.get('message');
    if (queryMessage) {
      setSuccessMessage(queryMessage);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
      
      // Clean up the URL by removing query parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.state, location.search]);

  // redirect authenticated user to profile screen
  useEffect(() => {
    if (userInfo) {
      navigate("/user-profile");
      // eslint-disable-next-line
    }
  }, [navigate, userInfo]);

  const submitForm = async (data) => {
    // Clear any existing errors
    dispatch(removeError());
    setEmailVerificationError(null);
    
    try {
      await dispatch(loginUser(data)).unwrap();
      // Success is handled by the redirect in useEffect
    } catch (err) {
      // Handle email verification error specially
      if (err.requiresVerification) {
        setEmailVerificationError({
          message: err.msg,
          email: err.email
        });
      }
      // Other errors are handled by the Redux state
      console.error('Login failed:', err);
    }
  };

  const removeErrMsg = () => {
    dispatch(removeError());
    setEmailVerificationError(null);
  };

  const handleRetry = () => {
    removeErrMsg();
    const emailField = document.getElementById('email');
    if (emailField) emailField.focus();
  };

  const resendVerification = async () => {
    if (!emailVerificationError?.email) return;

    try {
      setResendState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await axios.post('/auth/resend-verification', {
        email: emailVerificationError.email
      });
      
      setResendState({
        loading: false,
        success: true,
        error: null
      });
      
      // Show success message
      setSuccessMessage("Verification email sent! Please check your email.");
      setEmailVerificationError(null);
      
    } catch (error) {
      console.error('Resend verification error:', error);
      
      const errorMessage = error.response?.data?.msg || 'Failed to resend verification email. Please try again.';
      
      setResendState({
        loading: false,
        success: false,
        error: errorMessage
      });
    }
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
          <h1 className="title text-xl sm:text-2xl lg:text-3xl font-bold text-very-dark-blue mb-12">
            SIGN IN
          </h1>
          <form
            className="flex flex-wrap justify-between w-full"
            onSubmit={handleSubmit(submitForm)}
            onChange={removeErrMsg}
          >
            <fieldset disabled={loading} className="w-full contents">
            {error && !emailVerificationError && (
              <div className="absolute top-28 left-0 right-0 z-10">
                <ErrorDisplay 
                  error={{ msg: errMsg, type: 'LOGIN_ERROR' }}
                  onRetry={handleRetry}
                  onDismiss={removeErrMsg}
                  size="small"
                  className="mx-0"
                />
              </div>
            )}
            {emailVerificationError && (
              <div className="absolute top-28 left-0 right-0 z-10">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 mb-1">Email Verification Required</h3>
                      <p className="text-amber-700 mb-3">{emailVerificationError.message}</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          type="button"
                          onClick={resendVerification}
                          disabled={resendState.loading}
                          className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {resendState.loading ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailVerificationError(null)}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                        >
                          Dismiss
                        </button>
                      </div>
                      {resendState.success && (
                        <div className="mt-2 text-green-700 text-sm">
                          ✓ Verification email sent successfully!
                        </div>
                      )}
                      {resendState.error && (
                        <div className="mt-2 text-red-700 text-sm">
                          {resendState.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {successMessage && (
              <div className="absolute top-28 left-0 right-0 z-10">
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800">{successMessage}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="relative w-full mb-2 py-3">
              <input
                id="email"
                name="email"
                type="text"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  error || emailVerificationError ? 'border-red-500 focus:border-red-500' : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="username or email"
                {...register("email")}
                required
                aria-label="Username or Email"
                aria-describedby="email-error"
                autoComplete="username"
              />
              <label
                htmlFor="email"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Username or Email
              </label>
            </div>
            <div className="relative w-full mb-6 py-3">
              <input
                id="password"
                name="password"
                type="password"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  error || emailVerificationError ? 'border-red-500 focus:border-red-500' : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="Password"
                {...register("password")}
                required
                aria-label="Password"
                aria-describedby="password-error"
                autoComplete="current-password"
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Password
              </label>
            </div>
            <button
              type="submit"
              className={
                "w-full h-12 max-w-lg lg:max-w-none bg-orange rounded-md mt-3 mb-2 text-white flex items-center justify-center lg:w-2/5 border border-orange shadow-[inset_0_0_0_0_#ffede1] hover:shadow-[inset_0_-4rem_0_0_#ffede1] hover:text-orange transition-all duration-300 " +
                (loading ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90")
              }
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div
                    className="spinner-border animate-spin inline-block w-4 h-4 border rounded-full mr-2"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  SIGNING IN...
                </div>
              ) : (
                <>SIGN IN</>
              )}
            </button>
            <br />
            <br />
            <div className="links mt-12 flex flex-wrap justify-between w-full">
              <NavLink
                to="/forgot-password"
                className="mb-5 lg:mb-0 border-b-2 border-solid hover:border-orange border-transparent transition-all"
              >
                FORGET PASSWORD?
              </NavLink>
              <NavLink
                to="/register"
                className="border-b-2 border-solid border-transparent hover:border-orange transition-color"
                href="/"
              >
                CREATE NEW ACCOUNT
              </NavLink>
            </div>
            </fieldset>
          </form>
        </div>
      </div>
      Login
    </div>
  );
};

export default Login;
