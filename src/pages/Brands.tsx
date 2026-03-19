import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Brands = () => {
  const brands = [
    {
      id: 'bisleri',
      name: 'Bisleri',
      img: '/images/bisleri.png',
      tagline: 'Har Paani Ki Bottle Bisleri Nahi',
      description: 'Bisleri International is an Indian company best known for its Bisleri brand of bottled water. Founded in 1969, Bisleri is one of the most trusted and recognized water brands in India with the highest market share.',
      founded: '1969',
      products: 4
    },
    {
      id: 'kinley',
      name: 'Kinley',
      logo: '🌊',
      tagline: 'Boond Boond Mein Vishwas',
      description: 'Kinley is a brand of still or carbonated water owned by The Coca-Cola Company. Known for its rigorous purification process, Kinley ensures every drop is pure and safe for consumption.',
      founded: '2000',
      products: 2
    },
    {
      id: 'aquafina',
      name: 'Aquafina',
      logo: '💦',
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
      logo: '💎',
      tagline: 'Pure & Affordable',
      description: 'Bailey is an affordable packaged drinking water brand that maintains high quality standards while offering competitive pricing. Perfect for everyday hydration needs.',
      founded: '2005',
      products: 1
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Partner Brands</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We partner with the most trusted water brands to bring you the purest and safest drinking water.
            </p>
          </div>

          {/* Brands Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {brands.map((brand) => (
                <Card key={brand.id} className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      {brand.img ? (
                        <img src={brand.img} alt={brand.name} className="mx-auto mb-4 h-24 w-24 object-cover rounded-full border border-gray-200" />
                      ) : (
                        <span className="text-6xl mb-4 block">{brand.logo}</span>
                      )}
                      <h2 className="text-2xl font-bold text-gray-900">{brand.name}</h2>
                      <p className="text-blue-600 font-medium italic mt-1">"{brand.tagline}"</p>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{brand.description}</p>
                    <div className="flex justify-between text-sm text-gray-500 mb-4 py-3 border-t border-b">
                      <span>Founded: <strong>{brand.founded}</strong></span>
                      <span>Products: <strong>{brand.products}</strong></span>
                    </div>
                    <Link to={`/products?brand=${brand.id}`}>
                      <Button className="w-full bg-blue-500 hover:bg-blue-600">
                        View Products <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
            ))}
          </div>

          {/* Quality Section */}
          <section className="mt-16 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-8 md:p-12 text-white">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Quality You Can Trust</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                All our partner brands undergo rigorous quality checks and meet international safety standards.
              </p>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">100%</div>
                  <p className="text-blue-100">Quality Tested</p>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">6+</div>
                  <p className="text-blue-100">Trusted Brands</p>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">ISO</div>
                  <p className="text-blue-100">Certified</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Brands;
