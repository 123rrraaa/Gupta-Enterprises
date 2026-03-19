import { MapPin, Truck, Package, CheckCircle, Home, Building2 } from 'lucide-react';

interface OrderTrackingMapProps {
  status: string;
  customerCity: string;
}

const OrderTrackingMap = ({ status, customerCity }: OrderTrackingMapProps) => {
  const getStatusStep = (currentStatus: string): number => {
    switch (currentStatus.toLowerCase()) {
      case 'confirmed': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'out for delivery': return 4;
      case 'delivered': return 5;
      case 'cancelled': return 0;
      default: return 1;
    }
  };

  const step = getStatusStep(status);
  const isCancelled = status.toLowerCase() === 'cancelled';

  const locations = [
    { name: 'Warehouse', icon: Building2 },
    { name: 'Sorting Center', icon: Package },
    { name: 'In Transit', icon: Truck },
    { name: customerCity || 'Your City', icon: MapPin },
    { name: 'Delivered', icon: Home },
  ];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-500" />
        Live Tracking Map
      </h4>
      
      {/* Map Visualization */}
      <div className="relative bg-white rounded-lg p-4 shadow-inner min-h-[120px]">
        {/* Road/Path */}
        <div className="absolute top-1/2 left-8 right-8 h-2 bg-gray-200 rounded-full -translate-y-1/2">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              isCancelled ? 'bg-red-400' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
            }`}
            style={{ width: isCancelled ? '0%' : `${Math.min((step / 5) * 100, 100)}%` }}
          />
        </div>
        
        {/* Location Points */}
        <div className="relative flex justify-between items-center">
          {locations.map((location, index) => {
            const isActive = step > index;
            const isCurrent = step === index + 1;
            const IconComponent = location.icon;
            
            return (
              <div key={index} className="flex flex-col items-center z-10">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${isCancelled ? 'bg-gray-200 text-gray-400' : 
                      isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 
                      isCurrent ? 'bg-cyan-400 text-white animate-pulse shadow-lg shadow-cyan-200' : 
                      'bg-gray-100 text-gray-400'}
                  `}
                >
                  <IconComponent className="h-5 w-5" />
                </div>
                <span className={`text-xs mt-2 text-center max-w-[60px] ${
                  isActive || isCurrent ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}>
                  {location.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Moving Truck Animation */}
        {!isCancelled && step >= 3 && step < 5 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000"
            style={{ left: `calc(${(step / 5) * 100}% - 12px)` }}
          >
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Truck className="h-3 w-3 text-white" />
            </div>
          </div>
        )}

        {/* Delivered Checkmark */}
        {step === 5 && (
          <div className="absolute top-1/2 right-6 -translate-y-1/2">
            <CheckCircle className="h-8 w-8 text-green-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Status Message */}
      <div className={`mt-3 text-center text-sm font-medium ${
        isCancelled ? 'text-red-500' : 
        step === 5 ? 'text-green-600' : 'text-blue-600'
      }`}>
        {isCancelled ? '❌ Order Cancelled' : 
         step === 5 ? '✅ Successfully Delivered!' : 
         `📍 Your order is ${status.toLowerCase()}`}
      </div>
    </div>
  );
};

export default OrderTrackingMap;
