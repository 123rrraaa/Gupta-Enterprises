import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useApp } from '@/context/AppContext';
import { useToast } from "@/hooks/use-toast";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal } = useApp();
  const { toast } = useToast();

  const handleRemove = (productId: string | number, productName: string) => {
    removeFromCart(productId);
    toast({
      title: "Removed from Cart",
      description: `${productName} has been removed from your cart.`,
    });
  };

  const deliveryCharge = getCartTotal() >= 2000 ? 0 : 30;
  const finalTotal = getCartTotal() + deliveryCharge;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-36 sm:pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingCart className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <span className="text-gray-500">({cart.length} items)</span>
          </div>

          {cart.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="text-xs text-blue-600 font-medium uppercase">{item.product.brand}</p>
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-500">{item.product.size}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg font-bold text-blue-600">₹{item.product.price}</span>
                        {item.product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">₹{item.product.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product._id || item.product.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product._id || item.product.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <Button
                        onClick={() => handleRemove(item.product._id || item.product.id, item.product.name)}
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-900">₹{item.product.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="bg-white border-0 shadow-lg sticky top-28">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">₹{getCartTotal()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivery</span>
                        <span className={`font-medium ${deliveryCharge === 0 ? 'text-green-500' : ''}`}>
                          {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                        </span>
                      </div>
                      {deliveryCharge > 0 && (
                        <p className="text-xs text-blue-600">
                          Add ₹{2000 - getCartTotal()} more for free delivery!
                        </p>
                      )}
                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-blue-600">₹{finalTotal}</span>
                        </div>
                      </div>
                    </div>

                    <Link to="/checkout">
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 py-6 text-lg">
                        Proceed to Checkout
                      </Button>
                    </Link>

                    <Link to="/products" className="block mt-4">
                      <Button variant="outline" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Add some products to your cart to get started!</p>
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

export default Cart;
