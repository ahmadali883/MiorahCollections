import { BrowserRouter } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyRoutes from "./routes/MyRoutes";
import { loadUserFromStorage } from "./redux/reducers/authSlice";
import SessionManager from "./components/SessionManager";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const dispatch = useDispatch();
  const { userToken, userInfo, refreshing } = useSelector(state => state.auth);
  const hasInitialized = useRef(false);
  
  // On app load, initialize user session only once
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (hasInitialized.current || refreshing) return;
    
    if (userToken && !userInfo) {
      hasInitialized.current = true;
      dispatch(loadUserFromStorage());
    }
  }, [dispatch, userToken, userInfo, refreshing]);

  // Reset initialization flag when user logs out
  useEffect(() => {
    if (!userToken) {
      hasInitialized.current = false;
    }
  }, [userToken]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="App font-kumbh-sans w-full min-h-screen relative overflow-hidden">
          <SessionManager />
          <MyRoutes />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
