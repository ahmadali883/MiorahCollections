import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axios from '../../utils/axiosConfig';
import Loading from '../../components/Loading';
import api from '../../config/api';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [verificationState, setVerificationState] = useState({
    loading: true,
    success: false,
    error: null,
    message: ''
  });
  
  const [resendState, setResendState] = useState({
    loading: false,
    success: false,
    error: null,
    message: ''
  });
  
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationState({
        loading: false,
        success: false,
        error: 'Invalid verification link',
        message: 'This verification link is invalid or incomplete.'
      });
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    try {
      setVerificationState(prev => ({ ...prev, loading: true }));
      
      // const response = await axios.post('/auth/verify-email', {
      const response = await api.post('/auth/verify-email', {
        token: verificationToken
      });
      
      setVerificationState({
        loading: false,
        success: true,
        error: null,
        message: response.data.message
      });
      
      // Store user email for potential resend
      if (response.data.user) {
        setUserEmail(response.data.user.email);
      }
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Email verified successfully! You can now log in.' }
        });
      }, 3000);
      
    } catch (error) {
      console.error('Email verification error:', error);
      
      const errorMessage = error.response?.data?.msg || 'Verification failed. Please try again.';
      
      setVerificationState({
        loading: false,
        success: false,
        error: errorMessage,
        message: ''
      });
      
      // If token is expired, we might want to show resend option
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        // We don't have the email from an expired token, so show input field
        setUserEmail('');
      }
    }
  };

  const resendVerification = async () => {
    if (!userEmail) {
      setResendState({
        loading: false,
        success: false,
        error: 'Please enter your email address',
        message: ''
      });
      return;
    }

    try {
      setResendState(prev => ({ ...prev, loading: true, error: null }));
      
      // const response = await axios.post('/auth/resend-verification', {
      const response = await api.post('/auth/resend-verification', {
        email: userEmail
      });
      
      setResendState({
        loading: false,
        success: true,
        error: null,
        message: response.data.message
      });
      
    } catch (error) {
      console.error('Resend verification error:', error);
      
      const errorMessage = error.response?.data?.msg || 'Failed to resend verification email. Please try again.';
      
      setResendState({
        loading: false,
        success: false,
        error: errorMessage,
        message: ''
      });
    }
  };

  if (verificationState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <Loading />
          <p className="mt-4 text-gray-600">Verifying your email address...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Verification</h1>
          <div className="w-16 h-1 bg-blue-500 mx-auto rounded"></div>
        </div>

        {verificationState.success ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-4">{verificationState.message}</p>
            <p className="text-sm text-gray-500 mb-6">
              You will be redirected to the login page in a few seconds...
            </p>
            <Link
              to="/login"
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{verificationState.error}</p>
            
            {/* Resend verification section */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Need a new verification link?</h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={resendVerification}
                  disabled={resendState.loading || !userEmail}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendState.loading ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
              
              {resendState.success && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{resendState.message}</p>
                </div>
              )}
              
              {resendState.error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{resendState.error}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <Link
                to="/register"
                className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Create New Account
              </Link>
              <Link
                to="/login"
                className="block w-full text-blue-500 hover:text-blue-600 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification; 