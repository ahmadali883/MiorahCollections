import React, { useEffect } from "react";
import AuthBg from "../../assets/user/auth-bg.jpg";
import { NavLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, removeError } from "../../redux/reducers/authSlice";
import ErrorDisplay from "../../components/ErrorDisplay";

const Register = () => {
  document.title = "Registration Page";

  const { loading, userInfo, error, errMsg, success } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    mode: "onChange",
  });

  const navigate = useNavigate();
  useEffect(() => {
    // redirect user to login page if registration was successful
    if (success) {
      // Add a slight delay to show success feedback
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Registration successful! Please login with your credentials.",
            type: "success" 
          } 
        });
      }, 1500);
    }
    // redirect authenticated user to profile screen
    if (userInfo) {
      navigate("/user-profile");
    }
    // eslint-disable-next-line
  }, [navigate, userInfo, success]);

  const submitForm = async (data) => {
    // Clear any existing errors
    dispatch(removeError());
    
    try {
      await dispatch(registerUser(data)).unwrap();
      // Success is handled by the redirect in useEffect
    } catch (err) {
      // Error is handled by the Redux state
      console.error('Registration failed:', err);
    }
  };

  const removeErrMsg = () => {
    dispatch(removeError());
  };

  const handleRetry = () => {
    removeErrMsg();
    // Focus on first field with error or first field
    const firstField = document.getElementById('firstname');
    if (firstField) firstField.focus();
  };

  return (
    <div className="relative">
      <div className="bg-pale-orange absolute inset-0 h-full -z-20">
        <img
          src={AuthBg}
          alt="elegant jewellery display background"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      </div>
      <div className="wrapper w-full min-h-screen py-12 sm:py-8 flex items-center justify-center">
        <div className="wrapper w-5/6 sm:w-3/4 md:w-3/5 xl:w-2/5 container py-16 px-8 sm:px-12 bg-white relative">
          <h1 className="title text-xl sm:text-2xl lg:text-3xl mb-12 font-bold">
            CREATE AN ACCOUNT
          </h1>
          <form
            className="flex flex-wrap justify-between w-full"
            onSubmit={handleSubmit(submitForm)}
            onChange={removeErrMsg}
          >
            <fieldset disabled={loading || success} className="w-full contents">
            {error && (
              <div className="absolute top-28 left-0 right-0 z-10">
                <ErrorDisplay 
                  error={{ msg: errMsg, type: 'REGISTRATION_ERROR' }}
                  onRetry={handleRetry}
                  onDismiss={removeErrMsg}
                  size="small"
                  className="mx-0"
                />
              </div>
            )}
            {success && (
              <div className="absolute top-28 left-0 right-0 z-10">
                <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-800">Registration successful! Redirecting to login...</span>
                  </div>
                </div>
              </div>
            )}
            <div className="relative w-full lg:w-[45%] mb-2 py-3">
              <input
                id="firstname"
                name="firstname"
                type="text"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.firstname 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="First Name"
                {...register("firstname", {
                  required: "Please enter your first name",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters long",
                  },
                  maxLength: {
                    value: 30,
                    message: "First name cannot exceed 30 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: "First name can only contain letters and spaces",
                  },
                })}
                aria-label="First Name"
                aria-describedby="firstname-error"
                autoComplete="given-name"
              />
              {errors.firstname && (
                <p id="firstname-error" className="text-sm text-[red] italic" role="alert">
                  {errors.firstname.message}
                </p>
              )}
              <label
                htmlFor="firstname"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                First Name
              </label>
            </div>
            <div className="relative w-full lg:w-[45%] mb-2 py-3">
              <input
                id="lastname"
                name="lastname"
                type="text"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.lastname 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="Last Name"
                {...register("lastname", {
                  required: "Please enter your last name",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters long",
                  },
                  maxLength: {
                    value: 30,
                    message: "Last name cannot exceed 30 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: "Last name can only contain letters and spaces",
                  },
                })}
                aria-label="Last Name"
                aria-describedby="lastname-error"
                autoComplete="family-name"
              />
              {errors.lastname && (
                <p id="lastname-error" className="text-sm text-[red] italic" role="alert">
                  {errors.lastname.message}
                </p>
              )}
              <label
                htmlFor="lastname"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Last Name
              </label>
            </div>
            <div className="relative w-full  mb-2 py-3">
              <input
                id="username"
                name="username"
                type="text"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.username 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="username"
                {...register("username", {
                  required: "Please enter your username",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters long",
                  },
                  maxLength: {
                    value: 20,
                    message: "Username cannot exceed 20 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: "Username can only contain letters, numbers, and underscores",
                  },
                })}
                aria-label="Username"
                aria-describedby="username-error"
                autoComplete="username"
              />
              {errors.username && (
                <p id="username-error" className="text-sm text-[red] italic" role="alert">
                  {errors.username.message}
                </p>
              )}
              <label
                htmlFor="username"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                username
              </label>
            </div>
            <div className="relative w-full  mb-2 py-3">
              <input
                id="email"
                name="email"
                type="email"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.email 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="email"
                {...register("email", {
                  required: "Please include an email",
                  pattern: {
                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                    message: "Please include a valid email",
                  },
                })}
                aria-label="Email Address"
                aria-describedby="email-error"
                autoComplete="email"
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-[red] italic" role="alert">
                  {errors.email.message}
                </p>
              )}
              <label
                htmlFor="email"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Email
              </label>
            </div>
            <div className="relative w-full lg:w-[45%] mb-6 py-3">
              <input
                id="password"
                name="password"
                type="password"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.password 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="Password"
                {...register("password", {
                  required: "Please enter your password",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters long",
                  },
                  maxLength: {
                    value: 100,
                    message: "Password cannot exceed 100 characters",
                  },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d)/,
                    message: "Password must contain at least one letter and one number",
                  },
                })}
                aria-label="Password"
                aria-describedby="password-error"
                autoComplete="new-password"
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-[red] italic" role="alert">
                  {errors.password.message}
                </p>
              )}
              <label
                htmlFor="password"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Password
              </label>
            </div>
            <div className="relative w-full lg:w-[45%] mb-6 py-3">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                className={`peer h-10 w-full border-b-2 text-very-dark-blue placeholder-transparent focus:outline-none ${
                  errors.confirmPassword 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-grayish-blue focus:border-orange'
                }`}
                placeholder="Confirm Password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) => {
                    const { password } = getValues();
                    return password === value || "Passwords do not match";
                  },
                })}
                aria-label="Confirm Password"
                aria-describedby="confirm-password-error"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-[red] italic" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
              <label
                htmlFor="confirm-password"
                className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
              >
                Confirm Password
              </label>
            </div>
            <div className="agreement text-sm text-dark-grayish-blue py-4">
              By creating an account, I consent to the processing of my personal
              data in accordance with the <b>PRIVACY POLICY</b>
            </div>
            <button
              type="submit"
              className={
                "w-full h-12 max-w-lg lg:max-w-none bg-orange rounded-md mt-3 lg:mt-5 mb-2 text-white flex items-center justify-center lg:w-2/5 shadow-[inset_0_-1px_0_0_#ffede1] hover:shadow-[inset_0_-4rem_0_0_#ffede1] hover:text-orange border transition-all duration-300 " +
                (loading || success ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:opacity-90")
              }
              disabled={loading || success}
            >
              {loading ? (
                <div className="flex items-center">
                  <div
                    className="spinner-border animate-spin inline-block w-4 h-4 border rounded-full mr-2"
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  CREATING ACCOUNT...
                </div>
              ) : success ? (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  SUCCESS
                </div>
              ) : (
                <>CREATE ACCOUNT</>
              )}
            </button>
            <div className="links mt-12 flex flex-wrap w-full">
              <span className="text-dark-grayish-blue lg:mr-4">
                Already have an account?{" "}
              </span>
              <NavLink
                to="/login"
                className="border-b-2 border-solid border-transparent hover:border-orange transition-color"
                href="/"
              >
                LOGIN
              </NavLink>
            </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
