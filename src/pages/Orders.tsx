import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, Phone, Calendar, ArrowRight, ShoppingBag, CheckCircle, Truck, Box, ClipboardList } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrderTrackingMap from '@/components/OrderTrackingMap';
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

const statusSteps = [
  { key: 'Confirmed', label: 'Confirmed', icon: ClipboardList },
  { key: 'Processing', label: 'Processing', icon: Box },
  { key: 'Shipped', label: 'Shipped', icon: Package },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle },
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Get logged in user info
        const userInfo = JSON.parse(localStorage.getItem('water-current-user') || '{}');
        const userEmail = userInfo.email;

        if (!userEmail) {
          console.log('No user logged in, skipping order fetch');
          setOrders([]);
          return;
        }

        // Fetch only this user's orders from MongoDB backend
        const res = await fetch(`https://gupta-enterprises-api.onrender.com/orders/user/${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Sort by createdAt in descending order
            data.sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA;
            });
            setOrders(data);
            console.log('Loaded orders for user:', data.length);
          }
        }
      } catch (err) {
        console.error('Failed to fetch orders from backend:', err);
      }
    };

    loadOrders();
    
    // Poll for updates every 3 seconds
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
        return 'bg-purple-100 text-purple-700';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-700';
      case 'out for delivery':
        return 'bg-orange-100 text-orange-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIndex = (status: string) => {
    const index = statusSteps.findIndex(s => s.key.toLowerCase() === status.toLowerCase());
    return index >= 0 ? index : 0;
  };

  const OrderTracker = ({ status }: { status: string }) => {
    const currentIndex = getStatusIndex(status);
    const isCancelled = status.toLowerCase() === 'cancelled';

    if (isCancelled) {
      return (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-600 font-medium text-center">Order Cancelled</p>
        </div>
      );
    }

    return (
      <div className="py-4 overflow-x-auto">
        <div className="flex items-center justify-between relative min-w-[280px]">
          {/* Progress Line */}
          <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-gray-200 -z-10" />
          <div 
            className="absolute top-4 sm:top-5 left-0 h-1 bg-blue-500 -z-10 transition-all duration-500"
            style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
          />
          
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;
            
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  } ${isCurrent ? 'ring-4 ring-blue-200' : ''}`}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center max-w-[50px] sm:max-w-[60px] leading-tight ${
                  isCompleted ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-36 sm:pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Package className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <Badge variant="outline" className="ml-2">Live Updates</Badge>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <div className="bg-blue-50 px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <p className="text-xs text-gray-500">Order ID</p>
                        <p className="font-semibold text-gray-900">{order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium text-gray-700 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} px-3 py-1`}>
                      {order.status}
                    </Badge>
                  </div>
                  
                    <CardContent className="p-6">
                      {/* Mini Tracking Map */}
                      <div className="mb-6">
                        <OrderTrackingMap status={order.status} customerCity={order.address.city} />
                      </div>

                      {/* Order Tracking Steps */}
                      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2 text-gray-900">Order Progress</h3>
                        <OrderTracker status={order.status} />
                      </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Order Items */}
                      <div className="lg:col-span-2">
                        <h3 className="font-semibold mb-4 text-gray-900">Items Ordered</h3>
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex gap-3 bg-gray-50 p-3 rounded-lg">
                              <img 
                                src={item.product.image} 
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-sm text-gray-500">{item.product.brand} • {item.product.size}</p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                  <p className="font-semibold text-blue-600">₹{item.product.price * item.quantity}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery & Payment Info */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-gray-900">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            Delivery Address
                          </h4>
                          <p className="text-sm text-gray-600">{order.address.fullName}</p>
                          <p className="text-sm text-gray-600">{order.address.address}</p>
                          <p className="text-sm text-gray-600">{order.address.city} - {order.address.pincode}</p>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {order.address.phone}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2 text-gray-900">Payment Details</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Subtotal</span>
                              <span>₹{order.total - order.deliveryCharge}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Delivery</span>
                              <span className={order.deliveryCharge === 0 ? 'text-green-500' : ''}>
                                {order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Total</span>
                              <span className="text-blue-600">₹{order.total}</span>
                            </div>
                            <div className="pt-2">
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                {order.paymentMethod}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
              <p className="text-gray-500 mb-6">Start shopping and your orders will appear here!</p>
              <Link to="/products">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Browse Products <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
