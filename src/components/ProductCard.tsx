import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { Product } from '@/types/product';
import { useApp } from '@/context/AppContext';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3Cg fill="%23999"%3E%3Cpath d="M85 75a15 15 0 1 1 30 0 15 15 0 0 1-30 0M45 130l40-60 30 50 45-70v70z"/%3E%3C/g%3E%3Ctext x="100" y="115" font-size="12" fill="%23999" text-anchor="middle" font-family="sans-serif"%3EImage Not Available%3C/text%3E%3C/svg%3E';

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart, toggleWishlist, isInWishlist } = useApp();
  const { toast } = useToast();
  const productId = product._id || product.id;
  const inWishlist = isInWishlist(productId);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Cart!",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    toast({
      title: inWishlist ? "Removed from Wishlist" : "Added to Wishlist!",
      description: inWishlist 
        ? `${product.name} has been removed from your wishlist.`
        : `${product.name} has been added to your wishlist.`,
    });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <Card className="group bg-white border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative overflow-hidden">
        <img 
          src={imageError ? PLACEHOLDER_IMAGE : product.image} 
          alt={product.name}
          onError={handleImageError}
          className="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105 bg-gray-50"
        />
        {discount > 0 && (
          <Badge className="absolute top-3 left-3 bg-green-500 text-white">
            {discount}% OFF
          </Badge>
        )}
        <Badge className="absolute top-3 right-3 bg-blue-500 text-white capitalize">
          {product.size}
        </Badge>
        <button
          onClick={handleToggleWishlist}
          className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${
            inWishlist 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-gray-600 hover:bg-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-blue-600 font-medium uppercase mb-1">{product.brand}</p>
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-blue-600">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
          )}
        </div>
        <Button 
          onClick={handleAddToCart}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
