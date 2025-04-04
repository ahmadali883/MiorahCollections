import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MyRoutes from "./routes/MyRoutes";
import { loadUserFromStorage } from "./redux/reducers/authSlice";

function App() {
  const dispatch = useDispatch();
  const { userToken, userInfo } = useSelector(state => state.auth);
  
  // On app load, if we have a token but no user info, try to fetch user info
  useEffect(() => {
    if (userToken && !userInfo) {
      dispatch(loadUserFromStorage());
    }
  }, [dispatch, userToken, userInfo]);

  return (
    <BrowserRouter>
      <div className="App font-kumbh-sans w-full min-h-screen relative overflow-hidden">
        <MyRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
