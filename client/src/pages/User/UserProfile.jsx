import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/reducers/authSlice";
import Loading from "../../components/Loading";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { emptyCartOnLogoout } from "../../redux/reducers/cartSlice";

const UserProfile = () => {
  const { userInfo, loading, error, userErrorMsg, userToken } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogOut = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(emptyCartOnLogoout());
      // Navigate to login page after successful logout
      navigate("/login", {
        state: {
          message: "You have been logged out successfully."
        }
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if server logout fails, still navigate to login
      // The logoutUser thunk already clears local storage on failure
      navigate("/login", {
        state: {
          message: "Logged out successfully."
        }
      });
    }
  };

  // Handle case when user becomes invalid (e.g., deleted from database)
  useEffect(() => {
    // If we have no token, redirect to login
    if (!userToken) {
      navigate("/login", { 
        state: { 
          message: "Please log in to access your profile." 
        } 
      });
      return;
    }

    // If we have a token but no userInfo and there's an error, redirect to login
    if (userToken && !userInfo && error) {
      console.warn('User profile: Token exists but no userInfo - redirecting to login');
      navigate("/login", { 
        state: { 
          message: "Your session has expired. Please log in again." 
        } 
      });
      return;
    }
  }, [userToken, userInfo, error, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <section className="h-auto pt-2 min-h-[80vh] bg-[#f9f9f9]">
        <div className="max-w-xl lg:max-w-7xl relative px-5 py-20 items-center mx-auto lg:mx-20 xl:mx-28 2xl:mx-40 3xl:mx-auto lg:px-1 xl:px-3 2xl:px-1">
          <div className="flex items-center justify-center">
            <Loading />
          </div>
        </div>
      </section>
    );
  }

  // If no token, don't render anything (useEffect will handle redirect)
  if (!userToken) {
    return null;
  }

  // If error state, show error message
  if (error && userErrorMsg) {
    return (
      <section className="h-auto pt-2 min-h-[80vh] bg-[#f9f9f9]">
        <div className="max-w-xl lg:max-w-7xl relative px-5 py-20 items-center mx-auto lg:mx-20 xl:mx-28 2xl:mx-40 3xl:mx-auto lg:px-1 xl:px-3 2xl:px-1">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Error</h2>
            <p className="text-gray-600 mb-6">{userErrorMsg}</p>
            <div className="space-y-4">
              <NavLink
                to="/login"
                className="block w-full bg-orange text-white py-3 px-6 rounded-md hover:bg-orange-600 transition-colors"
              >
                Login Again
              </NavLink>
              <NavLink
                to="/register"
                className="block w-full bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 transition-colors"
              >
                Create New Account
              </NavLink>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no userInfo, show login prompt
  if (!userInfo) {
    return (
      <section className="h-auto pt-2 min-h-[80vh] bg-[#f9f9f9]">
        <div className="max-w-xl lg:max-w-7xl relative px-5 py-20 items-center mx-auto lg:mx-20 xl:mx-28 2xl:mx-40 3xl:mx-auto lg:px-1 xl:px-3 2xl:px-1">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Please Log In</h2>
            <p className="text-gray-600 mb-6">
              Please{" "}
              <NavLink
                to="/login"
                className="text-orange border-b-2 border-b-orange font-bold hover:opacity-75"
              >
                Login
              </NavLink>{" "}
              to view this page
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="h-auto pt-2 min-h-[80vh] bg-[#f9f9f9]">
      <div className=" max-w-xl lg:max-w-7xl relative px-5 py-20 items-center mx-auto lg:mx-20 xl:mx-28 2xl:mx-40 3xl:mx-auto lg:px-1 xl:px-3 2xl:px-1">
        <div className="flex gap-x-4 flex-col lg:flex-row">
          <div className="lg:bg-white lg:w-1/4 rounded-lg lg:shadow-md py-4 h-fit">
            <div className="profile-img-wrapper w-32 h-32 bg-grayish-blue rounded-full mx-auto relative">
              <button className="w-5 h-5 absolute right-3 hidden">
                <ion-icon
                  class="text-very-dark-blue text-xl"
                  name="create"
                ></ion-icon>
              </button>
            </div>
            <h3 className="capitalize text-lg text-center my-6">
              <div className="font-bold ">
                {userInfo.firstname} {userInfo.lastname}
              </div>
            </h3>

            <nav className="space-y-1 bg-white">
              <NavLink
                to=""
                className={({ isActive }) =>
                  "text-dark-grayish-blue group  px-3 py-2 flex items-center text-sm font-medium" +
                  (!isActive
                    ? " hover:bg-light-grayish-blue"
                    : " border-l-4 bg-pale-orange border-orange hover:bg-pale-orange")
                }
                end
                aria-current="page"
                x-state-description='Current: "bg-pale-orange border-orange text-dark-grayish-blue", Default: "border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900"'
              >
                <ion-icon class="p-2 text-base" name="person"></ion-icon>
                <span className="truncate">My Account</span>
              </NavLink>

              <NavLink
                to="orders"
                className={({ isActive }) =>
                  "text-dark-grayish-blue group  px-3 py-2 flex items-center text-sm font-medium" +
                  (!isActive
                    ? " hover:bg-light-grayish-blue"
                    : " border-l-4 bg-pale-orange border-orange hover:bg-pale-orange")
                }
                x-state-description='undefined: "bg-pale-orange border-orange text-dark-grayish-blue", undefined: "border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900"'
              >
                <ion-icon class="p-2 text-base" name="basket"></ion-icon>
                <span className="truncate">My Orders</span>
              </NavLink>

              <NavLink
                to="addresses"
                className={({ isActive }) =>
                  "text-dark-grayish-blue group  px-3 py-2 flex items-center text-sm font-medium" +
                  (!isActive
                    ? " hover:bg-light-grayish-blue"
                    : " border-l-4 bg-pale-orange border-orange hover:bg-pale-orange")
                }
                x-state-description='undefined: "bg-pale-orange border-orange text-dark-grayish-blue", undefined: "border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900"'
              >
                <ion-icon class="p-2 text-base" name="location"></ion-icon>
                <span className="truncate">My Address</span>
              </NavLink>

              <NavLink
                to="notifications"
                className={({ isActive }) =>
                  "text-dark-grayish-blue group  px-3 py-2 flex items-center text-sm font-medium" +
                  (!isActive
                    ? " hover:bg-light-grayish-blue"
                    : " border-l-4 bg-pale-orange border-orange hover:bg-pale-orange")
                }
                x-state-description='undefined: "bg-pale-orange border-orange text-dark-grayish-blue", undefined: "border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900"'
              >
                <ion-icon class="p-2 text-base" name="notifications"></ion-icon>
                <span className="truncate">Notifications</span>
              </NavLink>

              <NavLink
                to="password"
                className={({ isActive }) =>
                  "text-dark-grayish-blue group  px-3 py-2 flex items-center text-sm font-medium" +
                  (!isActive
                    ? " hover:bg-light-grayish-blue"
                    : " border-l-4 bg-pale-orange border-orange hover:bg-pale-orange")
                }
                x-state-description='undefined: "bg-pale-orange border-orange text-dark-grayish-blue", undefined: "border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900"'
              >
                <ion-icon class="p-2 text-base" name="lock-closed"></ion-icon>
                <span className="truncate">Password</span>
              </NavLink>

              <NavLink
                to="settings"
                className={({ isActive }) =>
                  "text-dark-grayish-blue group  px-3 py-2 flex items-center text-sm font-medium" +
                  (!isActive
                    ? " hover:bg-light-grayish-blue"
                    : " border-l-4 bg-pale-orange border-orange hover:bg-pale-orange")
                }
                x-state-description='undefined: "bg-pale-orange border-orange text-dark-grayish-blue", undefined: "border-transparent text-gray-900 hover:bg-gray-50 hover:text-gray-900"'
              >
                <ion-icon class="p-2 text-base" name="settings"></ion-icon>
                <span className="truncate">Settings</span>
              </NavLink>

              {/* Admin Dashboard Link - Only visible for admin users */}
              {userInfo.isAdmin && (
                <>
                  <hr className="my-2 border-grayish-blue" />
                  <div className="px-3 py-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Admin</span>
                  </div>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      "text-dark-grayish-blue group px-3 py-2 flex items-center text-sm font-medium bg-orange-50 transition-all duration-200" +
                      (!isActive
                        ? " border-l-4 border-transparent hover:bg-orange hover:text-white hover:border-orange"
                        : " border-l-4 bg-orange border-orange text-white")
                    }
                  >
                    <ion-icon class="p-2 text-base" name="shield-checkmark"></ion-icon>
                    <span className="truncate">Admin Dashboard</span>
                  </NavLink>
                </>
              )}

              <hr className="my-2 border-grayish-blue" />
              <button
                onClick={onLogOut}
                className="w-full text-left text-dark-grayish-blue group hover:bg-light-grayish-blue px-3 py-2 flex items-center text-sm font-medium"
              >
                <ion-icon class="p-2 text-base" name="log-out"></ion-icon>
                <span className="truncate">Logout</span>
              </button>
            </nav>
          </div>
          <div className="bg-white flex-1 rounded-lg shadow-md p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserProfile;
