import React, { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { useSelector } from 'react-redux';

const CategoryForm = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const { userToken } = useSelector(state => state.auth);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories', err);
      setMessage({ type: 'error', text: 'Failed to load categories' });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': userToken
        }
      };

      let res;
      if (editMode) {
        res = await axios.put(`/categories/${currentId}`, formData, config);
        setMessage({ type: 'success', text: `Category "${res.data.name}" updated successfully` });
      } else {
        res = await axios.post('/categories', formData, config);
        setMessage({ type: 'success', text: `Category "${res.data.name}" created successfully` });
      }

      // Reset form and refresh categories
      setFormData({ name: '', description: '' });
      setEditMode(false);
      setCurrentId(null);
      fetchCategories();
    } catch (err) {
      console.error('Error with category operation', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Failed to process category' 
      });
    }
    
    setLoading(false);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditMode(true);
    setCurrentId(category._id);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    try {
      const config = {
        headers: {
          'x-auth-token': userToken
        }
      };

      await axios.delete(`/categories/${id}`, config);
      setMessage({ type: 'success', text: `Category "${name}" deleted successfully` });
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.msg || 'Failed to delete category' 
      });
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditMode(false);
    setCurrentId(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-very-dark-blue mb-6">
        {editMode ? 'Edit Category' : 'Add New Category'}
      </h2>
      
      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex justify-end space-x-4">
          {editMode && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange text-white rounded-md hover:opacity-90 focus:outline-none"
          >
            {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update' : 'Create')}
          </button>
        </div>
      </form>

      <h3 className="text-xl font-bold text-very-dark-blue mb-4">Existing Categories</h3>
      {categories.length === 0 ? (
        <p className="text-dark-grayish-blue">No categories found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoryForm;
