import { useState, useEffect } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, ArrowLeft, Droplets, Package, MapPin, Phone, Upload, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { enqueueOrder, processQueue } from '@/lib/orderSync';
import { useNavigate } from 'react-router-dom';
import { Product, CartItem } from '@/types/product';
import React from 'react';
import DataVisualization from './DataVisualization';

const sizeOptions = ['250ml', '330ml', '500ml', '750ml', '1L', '2L', '5L', '10L', '20L'];
const categoryOptions = ['mineral', 'cold drinks', 'fruit juices', 'energy drinks', 'soda'];
const brandOptions = ['bisleri', 'kinley', 'aquafina', 'himalayan', 'bailey', 'evian', 'sprite', 'coca cola', 'pepsi', 'fanta', 'frooti', 'smoodh', 'maaza'];
const statusOptions = ['Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const API_PRODUCTS = "https://gupta-enterprises-api.onrender.com/products";
const API_ORDERS = "https://gupta-enterprises-api.onrender.com/orders";
const API_TICKETS = "https://gupta-enterprises-api.onrender.com/ai/support-tickets";

interface SupportTicket {
  _id: string;
  conversationId: string;
  type: string;
  customerMessage: string;
  aiResponse: string;
  status: string;
  priority: string;
  createdAt: string;
}

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

interface ProductFormProps {
  formData: {
    name: string;
    brand: string;
    category: string;
    size: string;
    price: string;
    originalPrice: string;
    image: string;
    description: string;
    inStock: boolean;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitText: string;
}

const ProductForm: React.FC<ProductFormProps> = React.memo(({ formData, onInputChange, onSubmit, submitText }) => (
  <form onSubmit={onSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
    <div>
      <label className="block text-sm font-medium mb-2">Product Name *</label>
      <Input
        name="name"
        value={formData.name}
        onChange={onInputChange}
        placeholder="e.g., Bisleri Mineral Water"
        required
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Brand *</label>
        <select
          name="brand"
          value={formData.brand}
          onChange={onInputChange}
          className="w-full p-2 border border-input rounded-md bg-background"
          required
        >
          {brandOptions.map(brand => (
            <option key={brand} value={brand}>{brand.charAt(0).toUpperCase() + brand.slice(1)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={onInputChange}
          className="w-full p-2 border border-input rounded-md bg-background"
          required
        >
          {categoryOptions.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Size *</label>
      <select
        name="size"
        value={formData.size}
        onChange={onInputChange}
        className="w-full p-2 border border-input rounded-md bg-background"
        required
      >
        {sizeOptions.map(size => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Price (₹) *</label>
        <Input
          name="price"
          type="number"
          value={formData.price}
          onChange={onInputChange}
          placeholder="e.g., 20"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Original Price (₹)</label>
        <Input
          name="originalPrice"
          type="number"
          value={formData.originalPrice}
          onChange={onInputChange}
          placeholder="e.g., 25 (optional)"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Product Image *</label>
      <Input
        type="file"
        name="image"
        accept="image/*"
        onChange={onInputChange}
        className="cursor-pointer"
        required={!formData.image}
      />
      <p className="text-xs text-gray-500 mt-1">
        Upload JPG, PNG, GIF, or WebP (Image will be stored in Cloudinary)
      </p>
      {formData.image && !formData.image.startsWith('http') && (
        <div className="mt-3 p-2 bg-gray-100 rounded">
          <p className="text-xs text-gray-600 mb-2">Preview:</p>
          <img
            src={formData.image}
            alt="Preview"
            className="h-24 w-24 object-contain rounded"
          />
        </div>
      )}
      {formData.image && formData.image.startsWith('http') && (
        <div className="mt-3 p-2 bg-green-100 rounded">
          <p className="text-xs text-green-600">✓ Image uploaded to Cloudinary</p>
        </div>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Description *</label>
      <Textarea
        name="description"
        value={formData.description}
        onChange={onInputChange}
        placeholder="Describe the product..."
        rows={3}
        required
      />
    </div>

    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        name="inStock"
        id="inStock"
        checked={formData.inStock}
        onChange={onInputChange}
        className="h-4 w-4"
      />
      <label htmlFor="inStock" className="text-sm font-medium">In Stock</label>
    </div>

    <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
      {submitText}
    </Button>
  </form>
));

const Admin = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    brand: 'bisleri',
    category: 'mineral',
    size: '1L',
    price: '',
    originalPrice: '',
    image: '',
    description: '',
    inStock: true
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const [queueCount, setQueueCount] = useState<number>(0);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const updateQueueCount = () => {
    try {
      const q = JSON.parse(localStorage.getItem('water-orders-sync-queue') || '[]');
      setQueueCount(Array.isArray(q) ? q.length : 0);
    } catch (e) {
      setQueueCount(0);
    }
  };

  useEffect(() => {
    const currentAdmin = localStorage.getItem('water-current-admin');
    if (!currentAdmin) {
      navigate('/admin-login');
      return;
    }

    fetchProducts();
    fetchOrders();
    updateQueueCount();
    fetchTickets();
  }, [navigate]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_PRODUCTS);

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend error:", text);

        toast({
          title: "Server Error",
          description: "Products API not responding correctly",
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch failed:", err);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      console.log("Fetching orders from:", API_ORDERS);
      const res = await fetch(API_ORDERS);

      console.log("Response status:", res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Orders API error:", res.status, errorText);
        toast({
          title: "Server Error",
          description: `Orders API failed: ${res.status} - ${errorText}`,
          variant: "destructive",
        });
        return;
      }

      const data = await res.json();
      console.log("Raw orders data:", data);

      if (Array.isArray(data)) {
        // Use only backend orders from MongoDB (no localStorage fallback)
        const sourceOrders = data;

        const formattedOrders = sourceOrders.map((order: any) => {
          const id = order._id || order.id;

          // Normalize status to match one of the statusOptions (case-insensitive)
          const rawStatus = order.status ?? 'Confirmed';
          const matchedStatus = statusOptions.find(
            (s) => s.toLowerCase() === String(rawStatus).toLowerCase()
          );

          return {
            ...order,
            id,
            status: matchedStatus || rawStatus,
          };
        });

        console.log("Formatted orders:", formattedOrders);
        setOrders(
          formattedOrders.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          )
        );
      } else {
        console.error("Orders data is not an array:", data);
        toast({
          title: "Data Error",
          description: "Orders API did not return an array",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error("Orders fetch failed:", e);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      const fileInput = e.target as HTMLInputElement;
      const file = fileInput.files?.[0];

      if (file) {
        // Create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, [name]: e.target?.result as string }));
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        try {
          const formDataToUpload = new FormData();
          formDataToUpload.append('image', file);

          const response = await fetch('https://gupta-enterprises-api.onrender.com/upload/upload', {
            method: 'POST',
            body: formDataToUpload
          });

          if (response.ok) {
            const data = await response.json();
            // Store the Cloudinary URL
            setFormData(prev => ({ ...prev, [name]: data.url }));
            toast({
              title: "Success",
              description: "Image uploaded to Cloudinary!"
            });
          } else {
            const errorData = await response.json();
            toast({
              title: "Upload Error",
              description: errorData.error || "Failed to upload image",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast({
            title: "Error",
            description: "Failed to upload image to Cloudinary",
            variant: "destructive"
          });
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: 'bisleri',
      category: 'mineral',
      size: '1L',
      price: '',
      originalPrice: '',
      image: '',
      description: '',
      inStock: true
    });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.image || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate that image is a valid URL (uploaded to Cloudinary)
    if (!formData.image.startsWith('http')) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(API_PRODUCTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          brand: formData.brand,
          category: formData.category,
          size: formData.size,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
          image: formData.image,
          description: formData.description,
          inStock: formData.inStock
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add product");
      }

      toast({
        title: "Success",
        description: "Product added successfully!"
      });

      resetForm();
      setIsAddDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive"
      });
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      const response = await fetch(`${API_PRODUCTS}/${editingProduct._id || editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update product");
      }

      toast({
        title: "Success",
        description: "Product updated successfully!"
      });

      setIsEditDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    try {
      const response = await fetch(`${API_PRODUCTS}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast({
        title: "Success",
        description: "Product deleted successfully!"
      });

      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      brand: product.brand,
      category: product.category,
      size: product.size,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      image: product.image,
      description: product.description,
      inStock: product.inStock
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      // Persist to localStorage copy if present (so UI and local data stay in sync)
      try {
        const local = JSON.parse(localStorage.getItem('water-orders') || '[]');
        if (Array.isArray(local) && local.length) {
          const updated = local.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o);
          localStorage.setItem('water-orders', JSON.stringify(updated));
        }
      } catch (e) { console.error('Failed to update local orders status', e); }

      const response = await fetch(`${API_ORDERS}/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // If server returns updated order, merge that into state
        try {
          const respBody = await response.json().catch(() => null);
          if (respBody) {
            const updatedId = respBody._id || respBody.id || orderId;
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...respBody, id: updatedId } : o));
          }
        } catch (e) {
          console.error('Failed to parse PUT response body', e);
        }

        toast({ title: "Status Updated", description: `Order ${orderId} updated` });
        fetchOrders();
        updateQueueCount();
        return;
      }

      // If backend returned 404 (order not found), try to create the order on server
      if (response.status === 404) {
        const localOrder = orders.find(o => o.id === orderId);
        if (localOrder) {
          const orderToCreate = { ...localOrder, status: newStatus };

          try {
            const postRes = await fetch(API_ORDERS, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderToCreate),
            });

            if (!postRes.ok) {
              const text = await postRes.text();
              console.error('Failed to create order on server:', postRes.status, text);
              enqueueOrder(orderToCreate);
              toast({ title: 'Offline Saved', description: 'Order queued for sync; status updated locally' });
              updateQueueCount();
              fetchOrders();
              return;
            }

            // created successfully
            toast({ title: 'Status Updated', description: `Order ${orderId} created on server` });
            fetchOrders();
            updateQueueCount();
            return;
          } catch (err) {
            console.error('Error posting missing order to backend:', err);
            enqueueOrder(orderToCreate);
            toast({ title: 'Offline Saved', description: 'Order queued for sync; status updated locally' });
            updateQueueCount();
            fetchOrders();
            return;
          }
        }
      }

      throw new Error('Failed to update order status');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
      // Re-fetch to restore authoritative state from server/local
      fetchOrders();
    }
  };

  const handleSyncNow = async () => {
    try {
      await processQueue();
      updateQueueCount();
      fetchOrders();
      toast({ title: 'Sync', description: 'Sync completed' });
    } catch (e) {
      console.error('Sync failed', e);
      toast({ title: 'Sync Failed', description: 'See console for details', variant: 'destructive' });
    }
  };

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

  // ─── Support Tickets ──────────────────────────────────────────────────
  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch(API_TICKETS);
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch (e) {
      console.error('Fetch tickets failed:', e);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_TICKETS}/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
        toast({ title: 'Updated', description: 'Ticket status updated' });
      }
    } catch (e) {
      console.error('Update ticket failed:', e);
      toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' });
    }
  };

  const getTicketTypeColor = (type: string) => {
    switch (type) {
      case 'Payment': return 'bg-violet-100 text-violet-700';
      case 'Refund': return 'bg-orange-100 text-orange-700';
      case 'Agent Request': return 'bg-rose-100 text-rose-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTicketPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-700';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center gap-2 hover:bg-transparent hover:text-current"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Website
            </Button>
            <div className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            </div>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="products" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
              <Droplets className="h-4 w-4 shrink-0" />
              <span className="truncate">Products</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">Orders ({orders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="support-tickets" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="truncate">Tickets</span> {openTickets > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">{openTickets}</span>}
            </TabsTrigger>
            <TabsTrigger value="data-visualization" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 py-2">
              <span role="img" aria-label="chart" className="shrink-0">📊</span>
              <span className="truncate">Data Viz</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="flex justify-end mb-4">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Water Product</DialogTitle>
                  </DialogHeader>
                  <ProductForm
                    formData={formData}
                    onInputChange={handleInputChange}
                    onSubmit={handleAddProduct}
                    submitText="Add Product"
                  />
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Products ({products.length})</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const productId = product._id || product.id;
                      return (
                        <TableRow key={productId}>
                          <TableCell>
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <span className={badgeVariants({ variant: "outline" }) + " capitalize"}>{product.brand}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-700">{product.size}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={badgeVariants({ variant: "outline" }) + " capitalize"}>{product.category}</span>
                          </TableCell>
                          <TableCell className="font-semibold text-blue-600">₹{product.price}</TableCell>
                          <TableCell>
                            <Badge className={product.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                              {product.inStock ? 'In Stock' : 'Out of Stock'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => openEditDialog(product)}
                                variant="outline"
                                size="sm"
                                className="hover:bg-transparent hover:text-current"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteProduct(productId)}
                                className={buttonVariants({ variant: "outline", size: "sm" }) + " text-red-600 hover:text-red-700"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle>Order Management</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleSyncNow} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Sync Queue ({queueCount})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                          <div className="flex flex-wrap items-center gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Order ID</p>
                              <p className="font-semibold">{order.id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Date</p>
                              <p className="text-sm">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="font-semibold text-blue-600">₹{order.total}</p>
                            </div>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">Update Status:</label>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="p-2 border border-input rounded-md bg-background text-sm"
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-medium flex items-center gap-1 mb-2">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              Delivery Address
                            </p>
                            <p>{order.address.fullName}</p>
                            <p className="text-gray-600">{order.address.address}</p>
                            <p className="text-gray-600">{order.address.city} - {order.address.pincode}</p>
                            <p className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3" />
                              {order.address.phone}
                            </p>
                          </div>

                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-medium mb-2">Items ({order.items.length})</p>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-gray-600">
                                  <span>{item.product.name} ({item.product.size}) x{item.quantity}</span>
                                  <span>₹{item.product.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support-tickets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Customer Support Tickets
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-700">{openTickets} Open</Badge>
                    <Button
                      onClick={fetchTickets}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? (
                  <div className="text-center py-8 text-gray-500">Loading tickets...</div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div key={ticket._id} className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={getTicketTypeColor(ticket.type)}>
                              {ticket.type === 'Payment' ? '💳' : ticket.type === 'Refund' ? '💰' : ticket.type === 'Agent Request' ? '📞' : '❓'} {ticket.type}
                            </Badge>
                            <Badge className={getTicketPriorityColor(ticket.priority)}>
                              {ticket.priority === 'High' ? '🔴' : ticket.priority === 'Medium' ? '🟡' : '🟢'} {ticket.priority}
                            </Badge>
                            <Badge className={getTicketStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-500">Status:</label>
                            <select
                              value={ticket.status}
                              onChange={(e) => handleUpdateTicketStatus(ticket._id, e.target.value)}
                              className="p-1.5 border border-input rounded-md bg-background text-xs"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-700 mb-1">💬 Customer Message</p>
                            <p className="text-sm text-gray-800">{ticket.customerMessage}</p>
                          </div>
                          {ticket.aiResponse && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                              <p className="text-xs font-semibold text-blue-700 mb-1">🤖 AI Response</p>
                              <p className="text-sm text-gray-700 line-clamp-3">{ticket.aiResponse}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                          <span>ID: {ticket.conversationId.slice(0, 20)}...</span>
                          <span>{new Date(ticket.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No support tickets yet</p>
                    <p className="text-sm mt-1">Tickets are created automatically when customers raise payment, refund, or agent-related issues.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data-visualization">
            <DataVisualization orders={orders} products={products} />
          </TabsContent>
        </Tabs>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <ProductForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleEditProduct}
              submitText="Update Product"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;