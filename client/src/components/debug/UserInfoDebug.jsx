import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getUserDetails } from '../../redux/reducers/authSlice';

const UserInfoDebug = () => {
  const { userInfo, userToken, loading, error } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  return (
    <div className="bg-yellow-100 p-4 border border-yellow-400 rounded">
      <h3 className="text-lg font-semibold mb-2">Auth Debug Info</h3>
      <p>Token exists: {userToken ? '✅' : '❌'}</p>
      <p>User info exists: {userInfo ? '✅' : '❌'}</p>
      <p>Is admin: {userInfo?.isAdmin ? '✅' : '❌'}</p>
      <p>Loading: {loading ? '✅' : '❌'}</p>
      <p>Error: {error ? '✅' : '❌'}</p>
      
      {userToken && !userInfo && (
        <button 
          onClick={() => dispatch(getUserDetails())}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Load User Info
        </button>
      )}
      
      {userInfo && (
        <div className="mt-2">
          <p>Username: {userInfo.username}</p>
          <p>Email: {userInfo.email}</p>
          <p>ID: {userInfo._id}</p>
        </div>
      )}
    </div>
  );
};

export default UserInfoDebug;
