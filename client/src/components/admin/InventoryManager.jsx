import React, { useState, useEffect } from 'react';
const IMAGE_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace('/api', '');
import { useDispatch, useSelector } from 'react-redux';
import { 
  getAdminProducts, 
  updateProduct, 
  deleteProduct, 
  getLowStockProducts,
  getInventoryStats,
  bulkUpdateProducts,
  getCategories,
  toggleProductSelection,
  selectAllProducts,
  clearProductSelection,
  clearInventoryError
} from '../../redux/reducers/productSlice';

const InventoryManager = () => {
  const dispatch = useDispatch();
  const { 
    adminProducts, 
    lowStockProducts,
    inventoryStats,
    productsPagination,
    categories,
    inventoryLoading, 
    inventoryError, 
    inventoryErrorMsg,
    bulkUpdateLoading,
    selectedProducts
  } = useSelector(state => state.product);

  // State for filters and search
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    stockStatus: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // State for product editing
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // State for bulk operations
  const [showBulkModal, setBulkModal] = useState(false);
  const [bulkOperation, setBulkOperation] = useState('');
  const [bulkData, setBulkData] = useState({});

  // State for stock alerts
  const [showStockAlerts, setShowStockAlerts] = useState(false);
  const [stockThreshold, setStockThreshold] = useState(10);

  // Load data on component mount
  useEffect(() => {
    loadInventoryData();
    dispatch(getCategories());
    dispatch(getInventoryStats());
  }, [dispatch]);

  // Load products when filters change
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 20,
      ...filters
    };
    
    // Remove empty filter values
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === 'all') {
        delete params[key];
      }
    });

    dispatch(getAdminProducts(params));
  }, [dispatch, currentPage, filters]);

  const loadInventoryData = () => {
    dispatch(getInventoryStats());
    dispatch(getLowStockProducts(stockThreshold));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle product editing
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discount_price: product.discount_price || '',
      stock_quantity: product.stock_quantity,
      sku: product.sku || '',
      category_id: product.category_id._id,
      is_featured: product.is_featured,
      is_active: product.is_active
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    try {
      await dispatch(updateProduct({ 
        productId: editingProduct._id, 
        productData: editFormData 
      })).unwrap();
      setShowEditModal(false);
      setEditingProduct(null);
      // Refresh the current page
      const params = { page: currentPage, limit: 20, ...filters };
      dispatch(getAdminProducts(params));
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        // Refresh the current page
        const params = { page: currentPage, limit: 20, ...filters };
        dispatch(getAdminProducts(params));
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  // Handle bulk operations
  const handleBulkOperation = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products first');
      return;
    }

    try {
      await dispatch(bulkUpdateProducts({
        productIds: selectedProducts,
        updates: bulkData,
        operation: bulkOperation
      })).unwrap();
      
      setBulkModal(false);
      dispatch(clearProductSelection());
      // Refresh products
      const params = { page: currentPage, limit: 20, ...filters };
      dispatch(getAdminProducts(params));
      alert('Bulk operation completed successfully!');
    } catch (error) {
      console.error('Bulk operation failed:', error);
    }
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get stock status badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    } else if (stock <= 10) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">In Stock</span>;
    }
  };

  // Get status badge
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inactive</span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-very-dark-blue">Inventory Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowStockAlerts(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none"
          >
            Stock Alerts ({lowStockProducts?.length || 0})
          </button>
          <button
            onClick={loadInventoryData}
            disabled={inventoryLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none disabled:opacity-50"
          >
            {inventoryLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {inventoryError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {inventoryErrorMsg}
          <button
            onClick={() => dispatch(clearInventoryError())}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inventory Stats Cards */}
      {inventoryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-600">Total Products</h3>
            <p className="text-2xl font-bold text-blue-900">{inventoryStats.totalProducts}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-600">Low Stock</h3>
            <p className="text-2xl font-bold text-yellow-900">{inventoryStats.lowStockCount}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-red-600">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-900">{inventoryStats.outOfStockCount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-600">Total Value</h3>
            <p className="text-2xl font-bold text-green-900">
              Rs {inventoryStats.inventoryValue?.totalValue?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search by name, SKU..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
            <select
              value={filters.stockStatus}
              onChange={(e) => handleFilterChange('stockStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            >
              <option value="all">All Stock</option>
              <option value="available">Available</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange('sortBy', sortBy);
                handleFilterChange('sortOrder', sortOrder);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
              <option value="stock_quantity-asc">Stock Low-High</option>
              <option value="stock_quantity-desc">Stock High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Operations */}
      {selectedProducts.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-blue-700">
                {selectedProducts.length} product(s) selected
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setBulkModal(true)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
              >
                Bulk Operations
              </button>
              <button
                onClick={() => dispatch(clearProductSelection())}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === adminProducts.length && adminProducts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      dispatch(selectAllProducts());
                    } else {
                      dispatch(clearProductSelection());
                    }
                  }}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
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
            {inventoryLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="animate-spin inline-block w-6 h-6 border-t-2 border-b-2 border-orange rounded-full"></div>
                </td>
              </tr>
            ) : adminProducts?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              adminProducts?.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => dispatch(toggleProductSelection(product._id))}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.images && product.images.length > 0 ? (
                        <img
                          className="h-10 w-10 rounded-md object-cover mr-3"
                          src={
                            product.images[0].image_url?.startsWith('/uploads/')
                              ? `${IMAGE_BASE_URL}${product.images[0].image_url}`
                              : `${IMAGE_BASE_URL}/uploads/products/${product.images[0].image_url}`
                          }
                          alt={product.name}
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                          <span className="text-xs text-gray-500">No img</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {product.sku || 'N/A'}</div>
                        <div className="text-xs text-gray-400">ID: #{product._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.category_id?.name || 'No Category'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>Rs {product.price.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{product.stock_quantity}</div>
                    {getStockBadge(product.stock_quantity)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(product.is_active)}
                    {product.is_featured && (
                      <div className="text-xs text-blue-600 mt-1">Featured</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id, product.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {productsPagination && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((productsPagination.currentPage - 1) * productsPagination.limit) + 1} to{' '}
            {Math.min(productsPagination.currentPage * productsPagination.limit, productsPagination.totalProducts)} of{' '}
            {productsPagination.totalProducts} products
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(productsPagination.currentPage - 1)}
              disabled={!productsPagination.hasPrevPage}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: productsPagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 text-sm border border-gray-300 rounded-md ${
                  page === productsPagination.currentPage
                    ? 'bg-orange text-white border-orange'
                    : 'hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(productsPagination.currentPage + 1)}
              disabled={!productsPagination.hasNextPage}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {showEditModal && (
        <ProductEditModal
          product={editingProduct}
          formData={editFormData}
          setFormData={setEditFormData}
          categories={categories}
          onSave={handleUpdateProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          loading={inventoryLoading}
        />
      )}

      {/* Bulk Operations Modal */}
      {showBulkModal && (
        <BulkOperationsModal
          selectedCount={selectedProducts.length}
          categories={categories}
          onExecute={handleBulkOperation}
          onClose={() => setBulkModal(false)}
          bulkOperation={bulkOperation}
          setBulkOperation={setBulkOperation}
          bulkData={bulkData}
          setBulkData={setBulkData}
          loading={bulkUpdateLoading}
        />
      )}

      {/* Stock Alerts Modal */}
      {showStockAlerts && (
        <StockAlertsModal
          lowStockProducts={lowStockProducts}
          threshold={stockThreshold}
          setThreshold={setStockThreshold}
          onRefresh={() => dispatch(getLowStockProducts(stockThreshold))}
          onClose={() => setShowStockAlerts(false)}
          loading={inventoryLoading}
        />
      )}
    </div>
  );
};

// Product Edit Modal Component
const ProductEditModal = ({ product, formData, setFormData, categories, onSave, onClose, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_price: e.target.value ? parseFloat(e.target.value) : '' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={loading}
              className="px-4 py-2 bg-orange text-white rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Bulk Operations Modal Component
const BulkOperationsModal = ({ 
  selectedCount, 
  categories, 
  onExecute, 
  onClose, 
  bulkOperation, 
  setBulkOperation, 
  bulkData, 
  setBulkData, 
  loading 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Bulk Operations ({selectedCount} products)
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              >
                <option value="">Select Operation</option>
                <option value="price_update">Update Prices</option>
                <option value="stock_update">Update Stock</option>
                <option value="category_update">Change Category</option>
                <option value="feature_update">Feature/Unfeature</option>
                <option value="status_update">Activate/Deactivate</option>
              </select>
            </div>

            {bulkOperation === 'price_update' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Update Type</label>
                  <select
                    value={bulkData.priceType || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, priceType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Type</option>
                    <option value="percentage">Percentage Change</option>
                    <option value="fixed">Fixed Amount Change</option>
                    <option value="set">Set Specific Price</option>
                  </select>
                </div>
                {bulkData.priceType === 'percentage' && (
                  <input
                    type="number"
                    placeholder="Percentage (e.g., 10 for 10% increase, -10 for 10% decrease)"
                    value={bulkData.percentage || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, percentage: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
                {bulkData.priceType === 'fixed' && (
                  <input
                    type="number"
                    placeholder="Amount to add/subtract"
                    step="0.01"
                    value={bulkData.amount || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
                {bulkData.priceType === 'set' && (
                  <input
                    type="number"
                    placeholder="New price"
                    step="0.01"
                    value={bulkData.newPrice || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, newPrice: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
            )}

            {bulkOperation === 'stock_update' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Update Type</label>
                  <select
                    value={bulkData.stockType || ''}
                    onChange={(e) => setBulkData(prev => ({ ...prev, stockType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Type</option>
                    <option value="add">Add to Stock</option>
                    <option value="subtract">Subtract from Stock</option>
                    <option value="set">Set Specific Quantity</option>
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Quantity"
                  value={bulkData.quantity || ''}
                  onChange={(e) => setBulkData(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            {bulkOperation === 'category_update' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Category</label>
                <select
                  value={bulkData.categoryId || ''}
                  onChange={(e) => setBulkData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkOperation === 'feature_update' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feature Status</label>
                <select
                  value={bulkData.featured !== undefined ? bulkData.featured.toString() : ''}
                  onChange={(e) => setBulkData(prev => ({ ...prev, featured: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Status</option>
                  <option value="true">Feature Products</option>
                  <option value="false">Unfeature Products</option>
                </select>
              </div>
            )}

            {bulkOperation === 'status_update' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                <select
                  value={bulkData.active !== undefined ? bulkData.active.toString() : ''}
                  onChange={(e) => setBulkData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Status</option>
                  <option value="true">Activate Products</option>
                  <option value="false">Deactivate Products</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onExecute}
              disabled={loading || !bulkOperation}
              className="px-4 py-2 bg-orange text-white rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Execute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stock Alerts Modal Component
const StockAlertsModal = ({ lowStockProducts, threshold, setThreshold, onRefresh, onClose, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Low Stock Threshold</label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value))}
                className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange"
              />
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          <div className="space-y-3">
            {lowStockProducts?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No low stock products found
              </div>
            ) : (
              lowStockProducts?.map((product) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    {product.images && product.images.length > 0 ? (
                      <img
                        className="h-12 w-12 rounded-md object-cover mr-3"
                        src={product.images[0].image_url}
                        alt={product.name}
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-md mr-3 flex items-center justify-center">
                        <span className="text-xs text-gray-500">No img</span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.category_id?.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">{product.stock_quantity} remaining</div>
                    <div className="text-sm text-gray-500">Rs {product.price.toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager; 