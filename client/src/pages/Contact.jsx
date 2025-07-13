import React, { useState } from "react";
import api from "../config/api";
import ContactHeader from "../assets/page-header/contact-header.jpg";

const Contact = () => {
  document.title = "Contact Miorah Collections";
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    marketingConsent: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Debug logging for checkbox
    if (type === 'checkbox') {
      console.log('Checkbox changed:', name, 'checked:', checked);
      console.log('Previous state:', formData.marketingConsent);
    }
    
    setFormData(prev => {
      const newState = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Debug logging for new state
      if (type === 'checkbox') {
        console.log('New state will be:', newState.marketingConsent);
      }
      
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Send form data to backend
      const response = await api.post('/contact', formData);
      
      if (response.data.success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          marketingConsent: false
        });
        
        // Auto-hide success message after 8 seconds
        setTimeout(() => setSubmitStatus(null), 8000);
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setSubmitStatus('error');
      
      // Auto-hide error message after 8 seconds
      setTimeout(() => setSubmitStatus(null), 8000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-light-grayish-blue h-auto pt-2 min-h-[80vh]">
      <div className="max-w-xl sm:max-w-4xl lg:max-w-7xl relative px-5 pt-20 pb-12 items-center mx-auto lg:mx-20 xl:mx-28 2xl:mx-40 3xl:mx-auto lg:pb-2 lg:px-1 xl:px-3 2xl:px-1">
        <h2 className="product capitalize text-white font-bold text-center relative z-[1] lg:text-left text-3xl sm:text-4xl sm:leading-none pb-3 px-8">
          Contact Us
        </h2>
        <div className="absolute top-0 left-0 bg-dark-grayish-blue w-full h-48 rounded-md overflow-hidden">
          <img
            src={ContactHeader}
            alt="elegant jewellery display"
            className="opacity-10 absolute h-full w-full object-cover"
          />
        </div>

        <div className="flex mt-32 bg-pale-orange shadow-xl flex-col lg:flex-row max-w-xl lg:max-w-7xl mx-auto mb-32">
          <div className="other-contact flex-1 lg:mr-6 text-very-dark-blue text-base lg:text-2xl px-3 sm:px-5 lg:px-8 py-4 lg:py-16">
            <p className="font-bold">Got questions about our jewelry collection?</p>
            <p className="font-bold">We'd love to hear from you!</p>
            <p className="text-sm lg:text-base mt-4 text-dark-grayish-blue font-normal">
              Whether you're looking for the perfect piece, need custom jewelry advice, or have any questions about our products, our team is here to help.
            </p>

            <ul className="contact-details mt-8 lg:mt-12 text-dark-grayish-blue text-sm lg:text-lg">
              <li className="w-full flex items-center mb-6">
                <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center mr-4">
                  <ion-icon
                    name="business"
                    class="text-white text-lg"
                  ></ion-icon>
                </div>
                <div>
                  <p className="font-bold text-very-dark-blue">Miorah Collections</p>
                  <p className="text-sm text-dark-grayish-blue">Premium Artificial Jewelry</p>
                </div>
              </li>
              <li className="w-full flex items-center mb-6">
                <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center mr-4">
                  <ion-icon name="call" class="text-white text-lg"></ion-icon>
                </div>
                <div>
                  <p className="font-bold text-very-dark-blue">+92 344 8066483</p>
                  <p className="text-sm text-dark-grayish-blue">Call us for inquiries</p>
                </div>
              </li>
              <li className="w-full flex items-center mb-6">
                <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center mr-4">
                  <ion-icon name="mail" class="text-white text-lg"></ion-icon>
                </div>
                <div>
                  <p className="font-bold text-very-dark-blue">miorahcollectionsofficial@gmail.com</p>
                  <p className="text-sm text-dark-grayish-blue">Email us anytime</p>
                </div>
              </li>
              <li className="w-full flex items-center mb-4">
                <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center mr-4">
                  <ion-icon name="time" class="text-white text-lg"></ion-icon>
                </div>
                <div>
                  <p className="font-bold text-very-dark-blue">Business Hours</p>
                  <p className="text-sm text-dark-grayish-blue">Mon - Sat: 9:00 AM - 8:00 PM</p>
                  <p className="text-sm text-dark-grayish-blue">Sunday: 10:00 AM - 6:00 PM</p>
                </div>
              </li>
            </ul>

            {/* Social Media Links */}
            <div className="mt-8 lg:mt-12">
              <p className="font-bold text-very-dark-blue mb-4">Follow Us</p>
              <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 bg-orange rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                  <ion-icon name="logo-facebook" class="text-white text-lg"></ion-icon>
                </a>
                <a href="#" className="w-10 h-10 bg-orange rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                  <ion-icon name="logo-instagram" class="text-white text-lg"></ion-icon>
                </a>
                <a href="#" className="w-10 h-10 bg-orange rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                  <ion-icon name="logo-whatsapp" class="text-white text-lg"></ion-icon>
                </a>
              </div>
            </div>
          </div>
          <div className="form-wrapper w-full lg:w-[55%] bg-white">
            <div className="px-6 sm:px-12 py-8">
              <h3 className="text-2xl font-bold text-very-dark-blue mb-2">Send us a Message</h3>
              <p className="text-dark-grayish-blue text-sm mb-8">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
              
              {/* Success/Error Messages */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <ion-icon name="checkmark-circle" class="text-green-500 text-xl mr-3"></ion-icon>
                    <div>
                      <h4 className="text-green-800 font-semibold">Message Sent Successfully!</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Thank you for contacting Miorah Collections! We've sent your message and you'll receive a confirmation email shortly. We'll respond within 24 hours.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <ion-icon name="alert-circle" class="text-red-500 text-xl mr-3"></ion-icon>
                    <div>
                      <h4 className="text-red-800 font-semibold">Error Sending Message</h4>
                      <p className="text-red-700 text-sm mt-1">
                        Sorry, there was an error sending your message. Please try again or contact us directly at <strong>+92 344 8066483</strong> or <strong>miorahcollectionsofficial@gmail.com</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form className="w-full" onSubmit={handleSubmit}>
                <div className="relative mb-8">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="peer h-12 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange disabled:opacity-50"
                    placeholder="Your full name"
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                  >
                    Full Name *
                  </label>
                </div>

                <div className="relative mb-8">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="peer h-12 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange disabled:opacity-50"
                    placeholder="your.email@example.com"
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                  >
                    Email Address *
                  </label>
                </div>

                <div className="relative mb-8">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="peer h-12 w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange disabled:opacity-50"
                    placeholder="+92 300 1234567"
                  />
                  <label
                    htmlFor="phone"
                    className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                  >
                    Phone Number (Optional)
                  </label>
                </div>

                <div className="relative mb-8">
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="peer h-12 w-full border-b-2 border-grayish-blue text-very-dark-blue focus:outline-none focus:border-orange bg-transparent disabled:opacity-50"
                  >
                    <option value="">Select a subject</option>
                    <option value="product-inquiry">Product Inquiry</option>
                    <option value="custom-order">Custom Order Request</option>
                    <option value="order-status">Order Status</option>
                    <option value="return-exchange">Return/Exchange</option>
                    <option value="wholesale-inquiry">Wholesale Inquiry</option>
                    <option value="general">General Question</option>
                    <option value="complaint">Complaint</option>
                    <option value="feedback">Feedback</option>
                  </select>
                  <label
                    htmlFor="subject"
                    className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-3 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                  >
                    Subject *
                  </label>
                </div>

                <div className="relative mb-8">
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="5"
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="peer w-full border-b-2 border-grayish-blue text-very-dark-blue placeholder-transparent focus:outline-none focus:border-orange pt-2 resize-none disabled:opacity-50"
                    placeholder="Your message here..."
                  ></textarea>
                  <label
                    htmlFor="message"
                    className="absolute left-0 -top-3.5 text-dark-grayish-blue text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-grayish-blue peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-dark-grayish-blue peer-focus:text-sm"
                  >
                    Message *
                  </label>
                </div>

                <div className="mb-6">
                  <div className="flex items-start">
                    {/* Custom Checkbox Implementation */}
                    <div className="flex items-center">
                      <div 
                        className={`mr-3 mt-1 w-5 h-5 border-2 rounded cursor-pointer flex items-center justify-center transition-all duration-200 ${
                          formData.marketingConsent 
                            ? 'bg-orange border-orange' 
                            : 'bg-white border-gray-300 hover:border-orange'
                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!isSubmitting) {
                            console.log('Custom checkbox clicked! Current state:', formData.marketingConsent);
                            setFormData(prev => ({
                              ...prev,
                              marketingConsent: !prev.marketingConsent
                            }));
                          }
                        }}
                        role="checkbox"
                        aria-checked={formData.marketingConsent}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (!isSubmitting) {
                              setFormData(prev => ({
                                ...prev,
                                marketingConsent: !prev.marketingConsent
                              }));
                            }
                          }
                        }}
                      >
                        {formData.marketingConsent && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {/* Hidden input for form validation */}
                      <input 
                        type="checkbox" 
                        id="marketingConsent"
                        name="marketingConsent"
                        checked={formData.marketingConsent}
                        onChange={() => {}} // Controlled by the custom checkbox above
                        required
                        className="sr-only"
                        tabIndex={-1}
                      />
                    </div>
                    <label htmlFor="marketingConsent" className="text-sm text-dark-grayish-blue cursor-pointer leading-relaxed select-none">
                      I agree to receive marketing communications from Miorah Collections via email about new products, special offers, and jewelry trends. <span className="text-red-500">*</span>
                      <div className="text-xs text-gray-500 mt-1">
                        Status: {formData.marketingConsent ? '✅ Checked' : '❌ Unchecked'}
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-orange rounded-lg text-white font-semibold flex items-center justify-center hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <ion-icon name="send" class="mr-2"></ion-icon>
                      Send Message
                    </>
                  )}
                </button>

                <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start">
                    <ion-icon name="information-circle" class="text-orange text-xl mr-3 mt-1"></ion-icon>
                    <div>
                      <p className="text-sm text-dark-grayish-blue">
                        <strong>Quick Response:</strong> For urgent inquiries, please call us directly at 
                        <a href="tel:+923448066483" className="text-orange font-semibold hover:underline"> +92 344 8066483</a>
                        or email us at <a href="mailto:miorahcollectionsofficial@gmail.com" className="text-orange font-semibold hover:underline">miorahcollectionsofficial@gmail.com</a>
                      </p>
                      <p className="text-sm text-dark-grayish-blue mt-2">
                        <strong>WhatsApp:</strong> Send us a message on WhatsApp for instant support.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
