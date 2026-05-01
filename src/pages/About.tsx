import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Droplets, Shield, Truck, Award, Users, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  const values = [
    {
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      title: 'Quality First',
      description: 'We never compromise on the quality of our products we deliver to our customers.'
    },
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: 'Customer Focus',
      description: 'Our customers are at the heart of everything we do.'
    },
    {
      icon: <Award className="h-8 w-8 text-blue-500" />,
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our service.'
    }
  ];

  const qualityStandards = [
    'ISO 22000 Certified Partners',
    'BIS (Bureau of Indian Standards) Approved',
    'Safe & Hygienic Packaging',
    'Temperature Controlled Storage'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-36 sm:pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <section className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-full mb-6">
              <Droplets className="h-5 w-5" />
              <span className="font-medium">About Gupta Enterprises</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Trusted Partner for<br />
              <span className="text-blue-600">Wholesale Premium Beverages</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Founded in 2023, Gupta Enterprises is your one-stop destination for premium beverages from trusted brands. 
              We believe everyone deserves access to premium variety of beverages in wholesale prices.
            </p>
          </section>

          {/* Our Story */}
          <section className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Gupta Enterprises was built on a simple idea: making a premium variety of beverages easily accessible for businesses and customers alike. 
                We recognized that sourcing high-quality drinks from trusted brands in bulk could often be inconvenient and inconsistent.
              </p>
              <p className="text-gray-600 mb-4">
                To solve this, we partnered with some of the most reliable beverage brands in India and globally, offering a curated range of products. 
                From soft drinks and juices to energy drinks and packaged beverages, we provide options that cater to every need—whether for retail, hospitality, or events.
              </p>
              <p className="text-gray-600">
                Today, Gupta Enterprises proudly serves a growing network of clients, ensuring timely wholesale supply with a strong focus on quality, consistency, and customer satisfaction. 
                Our commitment to excellence continues to drive everything we do.
              </p>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=600&h=400&fit=crop"
                alt="Premium Water"
                className="rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-blue-500 text-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold">2023</div>
                <div className="text-blue-100">Established</div>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
              <p className="text-gray-600">The principles that guide everything we do</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <Card key={index} className="bg-white border-0 shadow-lg">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Quality Standards */}
          <section className="bg-white rounded-2xl p-8 md:p-12 shadow-lg mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Quality Standards</h2>
                <p className="text-gray-600 mb-6">
                  We partner only with brands that meet the highest quality standards. Every product we sell goes 
                  through rigorous quality checks to ensure you get nothing but the purest quality beverages.
                </p>
                <ul className="space-y-3">
                  {qualityStandards.map((standard, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{standard}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">6+</div>
                  <p className="text-gray-600">Trusted Brands</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">12+</div>
                  <p className="text-gray-600">Products</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">1000+</div>
                  <p className="text-gray-600">Happy Customers</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
                  <p className="text-gray-600">Quality Assured</p>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Gupta Enterprises?</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
                <p className="text-gray-600">Same day delivery available across the city. Order before noon for delivery by evening.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Guaranteed Quality</h3>
                <p className="text-gray-600">All products are quality tested and stored in temperature-controlled environments.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Best Prices</h3>
                <p className="text-gray-600">Competitive pricing on all products. Get the best value for our premium variety of beverages.</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience our Products?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Browse our collection of premium beverages and stay hydrated with the best.
            </p>
            <Link to="/products">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
