import { Link } from 'react-router-dom';
import { Droplets, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold text-blue-400 mb-4">
              <Droplets className="h-8 w-8" />
              <span>Gupta Enterprises</span>
            </div>
            <p className="text-gray-400 mb-4">
              Your trusted destination for premium beverages. Pure, safe, and refreshing hydration delivered to your doorstep.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-blue-400">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/" className="hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/products" className="hover:text-blue-400 transition-colors">Products</Link></li>
              <li><Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-blue-400">Categories</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link to="/products?category=mineral" className="hover:text-blue-400 transition-colors">Mineral Water</Link></li>
              <li><Link to="/products?category=cold drinks" className="hover:text-blue-400 transition-colors">Cold Drinks</Link></li>
              <li><Link to="/products?category=fruit juices" className="hover:text-blue-400 transition-colors">Fruit Juices</Link></li>
              <li><Link to="/products?category=energy drinks" className="hover:text-blue-400 transition-colors">Energy Drinks</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-blue-400">Contact Us</h4>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <a href="tel:+917039641201" className="hover:text-blue-400">+91 7039641201</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <a href="mailto:guptaenterprises259@gmail.com" className="hover:text-blue-400">guptaenterprises259@gmail.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-400 mt-1" />
                <a href="https://www.google.com/maps/search/Shop+No.+5,+Meena+Bazaar,+Somvanshiya+Gyati+Samaj,+Near+Police+Station,+Bhayandar+West,+Thane+401101" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Shop No. 5, Meena Bazaar, Somvanshiya Gyati Samaj, Near Police Station, Bhayandar (West), Thane - 401101</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2026 Gupta Enterprises. All rights reserved. Stay Hydrated!</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
