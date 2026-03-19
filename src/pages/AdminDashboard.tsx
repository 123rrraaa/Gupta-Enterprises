import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  TrendingUp, 
  ArrowRight,
  Settings,
  BarChart3,
  LogOut
} from 'lucide-react';
import { Product, CartItem } from '@/types/product';
import { useToast } from "@/hooks/use-toast";

interface Order {
  _id?: string;
  id?: string;
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

interface AdminUser {
  id: string;
  name: string;
  email: string;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if admin is logged in
    const currentAdmin = localStorage.getItem('water-current-admin');
    if (!currentAdmin) {
      navigate('/admin-login');
      return;
    }
    setAdmin(JSON.parse(currentAdmin));

    // Fetch products from API
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://gupta-enterprises-api.onrender.com/products');
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        } else {
          // Fallback to localStorage if API fails
          const savedProducts = localStorage.getItem('water-products');
          if (savedProducts) {
            setProducts(JSON.parse(savedProducts));
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Fallback to localStorage if API fails
        const savedProducts = localStorage.getItem('water-products');
        if (savedProducts) {
          setProducts(JSON.parse(savedProducts));
        }
      }
    };

    fetchProducts();

    // Fetch orders from MongoDB API
    const fetchOrders = async () => {
      try {
        const response = await fetch('https://gupta-enterprises-api.onrender.com/orders');
        if (response.ok) {
          const data = await response.json();
          const ordersArray = Array.isArray(data) ? data : data.orders || [];
          ordersArray.sort((a: Order, b: Order) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(ordersArray);
        } else {
          // Fallback to localStorage if API fails
          const savedOrders = localStorage.getItem('water-orders');
          if (savedOrders) {
            const parsedOrders = JSON.parse(savedOrders);
            parsedOrders.sort((a: Order, b: Order) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setOrders(parsedOrders);
          }
        }
      } catch (error) {
        console.error('Failed to fetch orders from API:', error);
        // Fallback to localStorage if API fails
        const savedOrders = localStorage.getItem('water-orders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          parsedOrders.sort((a: Order, b: Order) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(parsedOrders);
        }
      }
    };

    fetchOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('water-current-admin');
    toast({
      title: "Logged Out",
      description: "You have been logged out of admin panel",
    });
    navigate('/');
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total + order.deliveryCharge, 0);
  const pendingOrders = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const inStockProducts = products.filter(p => p.inStock).length;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-purple-100 text-purple-700';
      case 'shipped': return 'bg-yellow-100 text-yellow-700';
      case 'out for delivery': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome, {admin?.name || 'Admin'}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => navigate('/')}>
                View Website
              </Button>
              <Button onClick={() => navigate('/admin')} className="bg-blue-500 hover:bg-blue-600">
                <Settings className="h-4 w-4 mr-2" />
                Manage
              </Button>
              <Button variant="outline" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Products</p>
                  <p className="text-3xl font-bold">{products.length}</p>
                  <p className="text-blue-200 text-xs mt-1">{inStockProducts} in stock</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Droplets className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                  <p className="text-purple-200 text-xs mt-1">{pendingOrders} pending</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Revenue</p>
                  <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
                  <p className="text-green-200 text-xs mt-1">{deliveredOrders} delivered</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <IndianRupee className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Pending Delivery</p>
                  <p className="text-3xl font-bold">{pendingOrders}</p>
                  <p className="text-orange-200 text-xs mt-1">Need attention</p>
                </div>
                <div className="p-3 bg-white/20 rounded-full">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-blue-100 rounded-xl">
                <Droplets className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Manage Products</h3>
                <p className="text-gray-500 text-sm">Add, edit or remove products</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-purple-100 rounded-xl">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Manage Orders</h3>
                <p className="text-gray-500 text-sm">Update order status</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/products')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-4 bg-green-100 rounded-xl">
                <ShoppingCart className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">View Store</h3>
                <p className="text-gray-500 text-sm">See customer view</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Recent Orders
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => {
                  const orderId = order._id || order.id || 'N/A';
                  return (
                  <div 
                    key={orderId} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Package className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Order #{typeof orderId === 'string' ? orderId.slice(-6) : 'N/A'}</p>
                        <p className="text-sm text-gray-500">{order.address.fullName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      <p className="text-sm text-gray-500 mt-1">₹{order.total + order.deliveryCharge}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
