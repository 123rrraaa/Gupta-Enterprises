import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Droplets, Shield, Truck, Award, Star } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useApp } from '@/context/AppContext';
import CustomerSupportChatbot from '@/components/CustomerSupportChatbot';
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from '@/components/ui/dialog';
import React from 'react';

const Index = () => {
  const { products } = useApp();
  const featuredProducts = products.slice(0, 4);

  // Short brand list for homepage
  const brands = [
    { name: 'Bisleri', img: '/images/bisleri.png' },
    { name: 'Kinley', img: '/images/kinley.png' },
    { name: 'Aquafina', img: '/images/aqua.png' },
    { name: 'Pepsi', img: '/images/pepsi.jpeg' },
    { name: 'Coca Cola', img: '/images/coca cola.png' },
    { name: 'Others', logo: '+' },
  ];

  // Full brand list for popup (from Brands.tsx)
  const allBrands = [
    {
      id: 'parle-agro',
      name: 'Parle Agro',
      img: '/images/parleagro.png',
      tagline: 'Har Paani Ki Bottle Bisleri Nahi',
      description: 'Bisleri International is an Indian company best known for its Bisleri brand of bottled water. Founded in 1969, Bisleri is one of the most trusted and recognized water brands in India with the highest market share.',
      founded: '1969',
      products: 4
    },
    {
      id: 'mastaani',
      name: 'Mastani',
      img: '/images/mastani.png',
      tagline: 'Boond Boond Mein Vishwas',
      description: 'Kinley is a brand of still or carbonated water owned by The Coca-Cola Company. Known for its rigorous purification process, Kinley ensures every drop is pure and safe for consumption.',
      founded: '2000',
      products: 2
    },
    {
      id: 'amul',
      name: 'Amul',
      img: '/images/amul.png',
      tagline: 'Pure Water, Perfect Taste',
      description: 'Aquafina is a brand of purified bottled water products produced by PepsiCo. The brand uses a rigorous 7-step HydRO-7 purification process to deliver the purest water.',
      founded: '1994',
      products: 2
    },
    {
      id: 'himalayan',
      name: 'Himalayan',
      logo: '🏔️',
      tagline: 'From the Heart of Himalayas',
      description: 'Himalayan Natural Mineral Water is sourced from the pristine Shivalik range in the Himalayas. The water naturally filters through layers of rock, absorbing essential minerals along the way.',
      founded: '2003',
      products: 2
    },
    {
      id: 'evian',
      name: 'Evian',
      logo: '🌿',
      tagline: 'Live Young',
      description: 'Evian is a French brand of mineral water. It comes from several sources near Évian-les-Bains, on the south shore of Lake Geneva. Known globally as a premium natural mineral water brand.',
      founded: '1826',
      products: 1
    },
    {
      id: 'bailey',
      name: 'Bailey',
      img: '/images/bailey.png',
      tagline: 'Pure & Affordable',
      description: 'Bailey is an affordable packaged drinking water brand that maintains high quality standards while offering competitive pricing. Perfect for everyday hydration needs.',
      founded: '2005',
      products: 1
    }
  ];

  const features = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: 'Quality Assured',
      description: 'All products meet strict quality standards'
    },
    {
      icon: <Truck className="h-8 w-8 text-blue-500" />,
      title: 'Fast Delivery',
      description: 'Same day delivery across the city'
    },
    {
      icon: <Award className="h-8 w-8 text-blue-500" />,
      title: 'Best Brands',
      description: 'Premium brands you can trust'
    }
  ];

  const testimonials = [
    {
      name: "Priya Sharma",
      text: "Best water delivery service! Always on time and great quality.",
      rating: 5
    },
    {
      name: "Rahul Verma",
      text: "Love the variety of brands available. Very convenient shopping experience.",
      rating: 5
    },
    {
      name: "Anita Patel",
      text: "Great prices and excellent customer service. Highly recommend!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 min-h-[90vh] flex items-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute right-0 top-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
                <Droplets className="h-5 w-5" />
                <span className="text-sm font-medium">Premium Beverages Store</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Premium Variety Of <span className="text-cyan-200">Beverages</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Discover our collection of premium beverages from trusted brands.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/products">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto">
                    Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full blur-3xl opacity-30"></div>
              <img
                src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=600&fit=crop"
                alt="Premium Water Bottle"
                className="relative z-10 w-full max-w-md mx-auto rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500 mb-6">Trusted by leading brands</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {brands.map((brand) =>
              brand.name !== 'Others' ? (
                <div key={brand.name} className="text-center">
                  {brand.img ? (
                    <img
                      src={brand.img}
                      alt={brand.name}
                      className="h-12 mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <span className="text-4xl mb-2 block">{brand.logo}</span>
                  )}
                  <span className="text-gray-600 font-medium">{brand.name}</span>
                </div>
              ) : (
                <Dialog key="others">
                  <DialogTrigger asChild>
                    <div className="flex flex-col items-center">
                      <button className="mb-1 focus:outline-none bg-blue-100 hover:bg-blue-200 rounded-full w-16 h-16 flex items-center justify-center shadow">
                        <span className="text-4xl font-bold text-blue-600">+</span>
                      </button>
                      <span className="text-xs font-medium text-blue-600">Others</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>All Brands</DialogTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {allBrands.map((b) => (
                        <div key={b.id} className="flex items-center gap-4 p-2 border rounded-lg hover:bg-blue-50 transition">
                          {b.img ? (
                            <img src={b.img} alt={b.name} className="h-12 w-12 object-contain rounded-full border" />
                          ) : (
                            <span className="text-3xl">{b.logo}</span>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{b.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-600 mt-2">Handpicked premium water for you</p>
            </div>
            <Link to="/products">
              <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                Browse Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-gray-600">Trusted by thousands of happy customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Stay Hydrated?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust AquaPure for their daily hydration needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Customer Support Chatbot */}
      <CustomerSupportChatbot />
    </div>
  );
};

export default Index;
