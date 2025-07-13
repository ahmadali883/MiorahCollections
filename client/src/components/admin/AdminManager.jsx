import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { useSelector } from 'react-redux';

const AdminManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const { userToken, userInfo } = useSelector(state => state.auth);

  const fetchUsers = async () => {
    if (!userInfo?.isAdmin) {
      setMessage({ type: 'error', text: 'You do not have admin privileges' });
      return;
    }

    setLoading(true);
    try {
      const config = {
        headers: {
          'x-auth-token': userToken
        }
      };
      
      const res = await axios.get('/api/users', config);
      setUsers(res.data);
      setMessage({ type: 'success', text: 'Users loaded successfully' });
    } catch (err) {
      console.error('Error fetching users', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Failed to load users. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userToken && userInfo?.isAdmin) {
      fetchUsers();
    }
  }, [userToken, userInfo]);

  const toggleAdminStatus = async (userId, username, currentStatus) => {
    try {
      const config = {
        headers: {
          'x-auth-token': userToken
        }
      };
      
      await axios.put(`/api/users/${userId}/admin`, {}, config);
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isAdmin: !user.isAdmin } : user
      ));
      
      setMessage({ 
        type: 'success', 
        text: `${username} is ${!currentStatus ? 'now an admin' : 'no longer an admin'}`
      });
    } catch (err) {
      console.error('Error updating admin status', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Failed to update admin status' 
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-very-dark-blue mb-6">Manage Administrators</h2>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-t-2 border-b-2 border-orange rounded-full"></div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstname} {user.lastname}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isAdmin 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleAdminStatus(user._id, user.username, user.isAdmin)}
                      className={`text-sm px-3 py-1 rounded ${
                        user.isAdmin
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminManager;
