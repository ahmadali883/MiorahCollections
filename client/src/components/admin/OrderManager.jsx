import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  getAdminOrders, 
  getOrderDetails, 
  updateOrderStatus, 
  clearOrderDetails, 
  clearAdminError 
} from '../../redux/reducers/orderSlice';

const OrderManager = () => {
  const dispatch = useDispatch();
  const { 
    adminOrders, 
    orderDetails, 
    pagination, 
    adminLoading, 
    adminError, 
    adminErrorMsg 
  } = useSelector(state => state.order);

  // State for filters and search
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  });

  // State for order details modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // State for status update
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Load orders on component mount and filter changes
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
      ...filters
    };
    
    // Remove empty filter values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === 'all') {
        delete params[key];
      }
    });

    dispatch(getAdminOrders(params));
  }, [dispatch, currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    const params = {
      page: 1,
      limit: 10,
      ...filters
    };
    dispatch(getAdminOrders(params));
  };

  // Handle order details view
  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setShowOrderDetails(true);
    dispatch(getOrderDetails(orderId));
  };

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    setStatusUpdateLoading(true);
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      // Success feedback could be added here
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Clear error messages
  const handleClearError = () => {
    dispatch(clearAdminError());
  };

  // Status badge styles
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-very-dark-blue">Order Management</h2>
        <button
          onClick={handleClearError}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear Messages
        </button>
      </div>

      {/* Error Message */}
      {adminError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {adminErrorMsg}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* First Row: Search and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Orders
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search by customer name, email, or order ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Second Row: Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              />
            </div>
          </div>

          {/* Third Row: Amount Range and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                <option value="createdAt">Date Created</option>
                <option value="amount">Amount</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={adminLoading}
              className="px-6 py-2 bg-orange text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50"
            >
              {adminLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {adminLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-t-2 border-b-2 border-orange rounded-full"></div>
                </td>
              </tr>
            ) : adminOrders.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No orders found
                </td>
              </tr>
            ) : (
              adminOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order._id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.user ? (
                      <div>
                        <div className="font-medium">{order.user.firstname} {order.user.lastname}</div>
                        <div className="text-xs text-gray-400">@{order.user.username}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium">{order.address.firstname} {order.address.lastname}</div>
                        <div className="text-xs text-gray-400">Guest</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs {order.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewOrder(order._id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                      <StatusUpdateDropdown
                        orderId={order._id}
                        currentStatus={order.status}
                        onStatusUpdate={handleStatusUpdate}
                        loading={statusUpdateLoading}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalOrders)} of{' '}
            {pagination.totalOrders} orders
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm border border-gray-300 rounded-md ${
                  page === pagination.currentPage
                    ? 'bg-orange text-white border-orange'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && (
        <OrderDetailsModal
          orderId={selectedOrderId}
          orderDetails={orderDetails}
          loading={adminLoading}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrderId(null);
            dispatch(clearOrderDetails());
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
};

// Status Update Dropdown Component
const StatusUpdateDropdown = ({ orderId, currentStatus, onStatusUpdate, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const handleStatusChange = (newStatus) => {
    if (newStatus !== currentStatus) {
      onStatusUpdate(orderId, newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
      >
        Update Status
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <div className="py-1">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  status === currentStatus ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ orderId, orderDetails, loading, onClose, onStatusUpdate }) => {
  if (!orderDetails && !loading) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600',
      processing: 'text-blue-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-600',
      cancelled: 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Order Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-t-2 border-b-2 border-orange rounded-full"></div>
            </div>
          ) : orderDetails ? (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Order ID:</span> #{orderDetails._id}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(orderDetails.createdAt)}</p>
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-1 font-medium ${getStatusColor(orderDetails.status)}`}>
                        {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                      </span>
                    </p>
                    <p><span className="font-medium">Total Amount:</span> Rs {orderDetails.amount.toFixed(2)}</p>
                    <p><span className="font-medium">Payment ID:</span> {orderDetails.paymentID}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {orderDetails.user ? (
                      <>
                        <p><span className="font-medium">Name:</span> {orderDetails.user.firstname} {orderDetails.user.lastname}</p>
                        <p><span className="font-medium">Email:</span> {orderDetails.user.email}</p>
                        <p><span className="font-medium">Username:</span> @{orderDetails.user.username}</p>
                        {orderDetails.user.phone && (
                          <p><span className="font-medium">Phone:</span> {orderDetails.user.phone}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><span className="font-medium">Name:</span> {orderDetails.address.firstname} {orderDetails.address.lastname}</p>
                        <p><span className="font-medium">Email:</span> {orderDetails.address.email}</p>
                        <p><span className="font-medium">Phone:</span> {orderDetails.address.phone}</p>
                        <p><span className="text-orange-600 font-medium">Guest Order</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  <p>{orderDetails.address.firstname} {orderDetails.address.lastname}</p>
                  <p>{orderDetails.address.address}</p>
                  <p>{orderDetails.address.city}, {orderDetails.address.state} {orderDetails.address.zipcode}</p>
                  {orderDetails.address.phone && <p>Phone: {orderDetails.address.phone}</p>}
                </div>
              </div>

              {/* Products */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Products</h4>
                <div className="space-y-2">
                  {orderDetails.products.map((product, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                        {product._id && (
                          <p className="text-xs text-gray-500">Product ID: #{product._id.slice(-8)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs {product.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Total: Rs {(product.price * product.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <StatusUpdateDropdown
                  orderId={orderDetails._id}
                  currentStatus={orderDetails.status}
                  onStatusUpdate={onStatusUpdate}
                  loading={false}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load order details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManager; 