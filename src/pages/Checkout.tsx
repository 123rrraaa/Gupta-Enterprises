import { useState } from 'react';
import { enqueueOrder } from '@/lib/orderSync';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, User, Truck, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useToast } from "@/hooks/use-toast";

import { CartItem } from '@/types/product';

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  deliveryCharge: number;
  address: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  paymentMethod: string;
  status: string;
  createdAt: string;
}

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const deliveryCharge = getCartTotal() >= 2000 ? 0 : 30;
  const finalTotal = getCartTotal() + deliveryCharge;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const API_ORDERS = "https://gupta-enterprises-api.onrender.com/orders";
  const API_PAYMENT = "https://gupta-enterprises-api.onrender.com/payment";

  // Handle Razorpay payment
  const handleRazorpayPayment = async (orderData: any) => {
    try {
      setIsProcessing(true);
      console.log('💳 Creating Razorpay order...');

      // Create Razorpay order
      const paymentRes = await fetch(`${API_PAYMENT}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderData.items,
          total: orderData.total,
          deliveryCharge: orderData.deliveryCharge,
          address: orderData.address,
          userId: orderData.userId,
          userEmail: orderData.userEmail
        })
      });

      if (!paymentRes.ok) {
        const errorData = await paymentRes.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to create payment order');
      }

      const { orderId: razorpayOrderId, key, amount } = await paymentRes.json();

      console.log('✅ Razorpay order created:', razorpayOrderId);

      // Load Razorpay script and open checkout
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: key,
          amount: amount,
          currency: 'INR',
          order_id: razorpayOrderId,
          name: 'Gupta Enterprises',
          description: 'Water Bottles Order',
          image: 'https://via.placeholder.com/100',
          prefill: {
            name: orderData.address.fullName,
            email: orderData.userEmail || '',
            contact: orderData.address.phone
          },
          handler: async (response: any) => {
            console.log('✅ Payment successful:', response);

            // Verify payment
            const verifyRes = await fetch(`${API_PAYMENT}/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                console.log('✅ Payment verified successfully');

                // Save order to MongoDB after payment success
                await saveOrderToBackend({ ...orderData, paymentMethod: 'razorpay' });

                setOrderId(razorpayOrderId);
                setIsOrderPlaced(true);
                clearCart();

                toast({
                  title: "Payment Successful!",
                  description: "Your order has been placed and confirmed.",
                });
              }
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast({
                title: 'Payment Cancelled',
                description: 'You cancelled the payment. Please try again.',
                variant: 'destructive'
              });
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (err: any) {
      console.error('Payment error:', err);
      toast({
        title: 'Payment Error',
        description: err.message || 'Failed to process payment. Please try again.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  // Save order to backend
  const saveOrderToBackend = async (orderData: any) => {
    try {
      const res = await fetch(API_ORDERS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to save order:', errorData);
        throw new Error(errorData.details || 'Failed to save order');
      }

      const savedOrder = await res.json();
      console.log('✅ Order saved to MongoDB:', savedOrder);
      return savedOrder;
    } catch (err) {
      console.error('Error saving order:', err);
      throw err;
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address || !formData.city || !formData.pincode) {
      toast({
        title: "Error",
        description: "Please fill in all delivery details",
        variant: "destructive"
      });
      return;
    }

    if (formData.phone.length < 10) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    // Get logged in user info
    const userInfo = JSON.parse(localStorage.getItem('water-current-user') || '{}');

    // Transform cart items to match Order schema (only include needed product fields)
    const orderItems = cart.map(item => ({
      product: {
        _id: item.product._id || item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        category: item.product.category,
        price: item.product.price,
        image: item.product.image,
        size: item.product.size
      },
      quantity: item.quantity
    }));

    const orderData = {
      items: orderItems,
      total: finalTotal,
      deliveryCharge,
      address: formData,
      paymentMethod: paymentMethod,
      userId: userInfo.id || '',
      userEmail: userInfo.email || '',
      status: 'Confirmed',
      notes: ''
    };

    // If Razorpay is selected, open payment gateway
    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment(orderData);
    } else {
      // Cash on Delivery - save directly
      setIsProcessing(true);
      try {
        // Save order to localStorage (keep offline-first behavior)
        const existingOrders = JSON.parse(localStorage.getItem('water-orders') || '[]');
        localStorage.setItem('water-orders', JSON.stringify([...existingOrders, orderData]));

        // Save to backend
        await saveOrderToBackend(orderData);

        setOrderId('ORD' + Date.now());
        setIsOrderPlaced(true);
        clearCart();

        toast({
          title: "Order Placed Successfully!",
          description: "Your order will be delivered soon. Please keep cash ready.",
        });
      } catch (err) {
        console.error('Error placing order:', err);
        toast({
          title: 'Error',
          description: 'Failed to place order. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (cart.length === 0 && !isOrderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <Button onClick={() => navigate('/products')} className="bg-blue-500 hover:bg-blue-600">
              Browse Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="text-center p-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
              <p className="text-gray-600 mb-2">Order ID: <span className="font-semibold">{orderId}</span></p>
              <p className="text-gray-600 mb-6">Your order will be delivered at the given address. Please keep cash ready for payment.</p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold mb-2">Delivery Address:</h3>
                <p className="text-sm text-gray-600">{formData.fullName}</p>
                <p className="text-sm text-gray-600">{formData.address}</p>
                <p className="text-sm text-gray-600">{formData.city} - {formData.pincode}</p>
                <p className="text-sm text-gray-600">Phone: {formData.phone}</p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/')} variant="outline">
                  Go Home
                </Button>
                <Button onClick={() => navigate('/products')} className="bg-blue-500 hover:bg-blue-600">
                  Continue Shopping
                </Button>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/cart')}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Delivery Address Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <User className="h-4 w-4 inline mr-1" />
                          Full Name *
                        </label>
                        <Input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Phone Number *
                        </label>
                        <Input
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Full Address *</label>
                      <Textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="House/Flat No., Building, Street, Landmark"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <Input
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Enter city"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">PIN Code *</label>
                        <Input
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                          placeholder="6-digit PIN code"
                          maxLength={6}
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        Payment Method
                      </h3>

                      {/* Cash on Delivery */}
                      <label className={`block rounded-lg p-4 mb-3 cursor-pointer border-2 transition ${paymentMethod === 'cash_on_delivery'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-green-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash_on_delivery"
                            checked={paymentMethod === 'cash_on_delivery'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-5 w-5 accent-green-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium">Cash on Delivery (COD)</p>
                            <p className="text-sm text-gray-500">Pay when your order arrives</p>
                          </div>
                          <Truck className="h-6 w-6 text-green-500" />
                        </div>
                      </label>

                      {/* Razorpay */}
                      <label className={`block rounded-lg p-4 cursor-pointer border-2 transition ${paymentMethod === 'razorpay'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="razorpay"
                            checked={paymentMethod === 'razorpay'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="h-5 w-5 accent-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium">Online Payment (Razorpay)</p>
                            <p className="text-sm text-gray-500">Cards, UPI, Net Banking, Wallets</p>
                          </div>
                          <CreditCard className="h-6 w-6 text-blue-500" />
                        </div>
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-blue-500 hover:bg-blue-600 py-6 text-lg mt-6 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : `Place Order - ₹${finalTotal}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-28">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.size} × {item.quantity}</p>
                          <p className="text-sm font-semibold text-blue-600">₹{item.product.price * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{getCartTotal()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery</span>
                      <span className={deliveryCharge === 0 ? 'text-green-500' : ''}>
                        {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">₹{finalTotal}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
