import { Link } from 'react-router-dom';
import { Heart, Users, Calendar, Shield } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
            <span className="text-2xl font-bold text-gray-800">Care4U</span>
          </div>
          <Link
            to="/login"
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Supporting Family Caregivers with{' '}
            <span className="text-primary-600">Smart Care</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Care4U helps you manage medication schedules, coordinate care, and stay connected
            with your loved ones—all in one beautiful, easy-to-use platform.
          </p>
          <Link
            to="/login"
            className="inline-block px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
          Everything You Need to Care Better
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Calendar className="w-12 h-12" />}
            title="Medication Management"
            description="Never miss a dose with smart reminders and easy tracking."
          />
          <FeatureCard
            icon={<Users className="w-12 h-12" />}
            title="Family Coordination"
            description="Keep everyone in the loop with real-time updates."
          />
          <FeatureCard
            icon={<Heart className="w-12 h-12" />}
            title="Caregiver Wellness"
            description="Track your well-being and get support when you need it."
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12" />}
            title="Secure & Private"
            description="Your data is encrypted and protected at all times."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p>&copy; 2024 Care4U. Built with care for caregivers.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Landing;

