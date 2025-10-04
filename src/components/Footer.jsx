import { Hospital, Navigation, Phone } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-600 to-blue-700 text-white  md:py-2 shadow-inner">
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
        
        {/* Left section */}
        <div className="flex items-center space-x-3 mb-6 md:mb-0">
          <Hospital className="w-8 h-8 text-white" />
          <span className="font-extrabold text-xl tracking-wide">MediNearby</span>
        </div>

        {/* Center section */}
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-8 text-sm text-gray-200">
          <span>© 2025 MediNearby</span>
          <span>All rights reserved</span>
          <span className="hover:text-yellow-300 cursor-pointer transition-colors">Privacy Policy</span>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-6 mt-6 md:mt-0">
          <button className="flex items-center space-x-2 hover:text-yellow-300 transition-colors">
            <Navigation className="w-5 h-5" />
            <span className="text-sm font-medium">Directions</span>
          </button>
          <button className="flex items-center space-x-2 hover:text-yellow-300 transition-colors">
            <Phone className="w-5 h-5" />
            <span className="text-sm font-medium">Contact</span>
          </button>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
