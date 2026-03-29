import { useNavigate } from 'react-router-dom';
import farmchainxLogo from '../assets/farmchainx-logo.svg';

function LandingPage() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleAdminClick = () => {
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-green-100">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-6">
        <div className="flex items-center gap-2">
          <img src={farmchainxLogo} alt="FarmchainX" className="h-10 w-10" />
          <span className="text-2xl font-bold text-green-700">FarmchainX</span>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleLoginClick}
            className="px-6 py-2.5 text-green-700 hover:text-green-800 font-semibold transition-colors"
          >
            Login
          </button>
          <button
            onClick={handleRegisterClick}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-md"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Welcome to <span className="text-green-600">FarmchainX</span>
            </h1>
            <p className="text-xl text-gray-700 leading-relaxed">
              Revolutionizing agriculture with blockchain technology. Connect directly with farmers, ensure product authenticity, and build a transparent supply chain.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Farm to Table</h3>
                  <p className="text-gray-600 text-sm">Direct connection between farmers and consumers</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Blockchain Verified</h3>
                  <p className="text-gray-600 text-sm">Complete product authenticity & transparency</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Fair Prices</h3>
                  <p className="text-gray-600 text-sm">Eliminate middlemen, better rates for farmers</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 mt-1">
                  ✓
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quality Assurance</h3>
                  <p className="text-gray-600 text-sm">AI-powered quality scoring & analytics</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <button
                onClick={handleRegisterClick}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
              <button
                onClick={handleLoginClick}
                className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-semibold transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Right Content - Visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Decorative shapes */}
              <div className="absolute top-20 left-0 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -bottom-8 right-12 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              {/* Illustration Container */}
              <div className="relative p-8 bg-white rounded-2xl shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="bg-green-100 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🌾</div>
                      <p className="text-sm font-semibold text-gray-700">Farmers</p>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🛒</div>
                      <p className="text-sm font-semibold text-gray-700">Customers</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-purple-100 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🚚</div>
                      <p className="text-sm font-semibold text-gray-700">Delivery</p>
                    </div>
                    <div className="bg-yellow-100 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">⛓️</div>
                      <p className="text-sm font-semibold text-gray-700">Blockchain</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Types Section */}
      <div className="bg-white bg-opacity-50 backdrop-blur-lg mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Choose Your Role
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Farmer Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-5xl mb-4">👨‍🌾</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Farmers</h3>
              <p className="text-gray-600 mb-6">
                Sell your products directly to customers, manage batches, track orders, and get real-time insights.
              </p>
              <ul className="space-y-2 text-gray-700 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> List & manage products
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Track deliveries
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Receive payments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> AI insights
                </li>
              </ul>
              <button
                onClick={handleRegisterClick}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                Register as Farmer
              </button>
            </div>

            {/* Customer Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-green-600">
              <div className="text-5xl mb-4">👩‍💼</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Customers</h3>
              <p className="text-gray-600 mb-6">
                Browse fresh farm products, verify authenticity, place orders, and support local farmers.
              </p>
              <ul className="space-y-2 text-gray-700 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Fresh products
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Verified quality
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Easy checkout
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Order tracking
                </li>
              </ul>
              <button
                onClick={handleRegisterClick}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                Register as Customer
              </button>
            </div>

            {/* Delivery Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Delivery Partners</h3>
              <p className="text-gray-600 mb-6">
                Join our delivery network, accept orders, track earnings, and become part of the supply chain.
              </p>
              <ul className="space-y-2 text-gray-700 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Flexible orders
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Real-time tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Track earnings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-600">✓</span> Fast payouts
                </li>
              </ul>
              <button
                onClick={handleRegisterClick}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
              >
                Register as Partner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 text-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={farmchainxLogo} alt="FarmchainX" className="h-8 w-8" />
                <span className="text-xl font-bold text-white">FarmchainX</span>
              </div>
              <p className="text-sm text-emerald-200">Revolutionizing agriculture with blockchain</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-emerald-100 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Features</a></li>
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Terms</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="text-emerald-100 hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="text-emerald-100 hover:text-white transition">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-emerald-800 pt-8 text-center text-sm text-emerald-200">
            <p>&copy; 2026 FarmchainX. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;

