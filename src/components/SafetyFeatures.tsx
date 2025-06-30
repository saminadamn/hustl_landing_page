import React, { useState } from 'react';
import { X, Shield, MapPin, Bell, Phone, Users, AlertTriangle, Mail, Calendar, Clock, User } from 'lucide-react';
import SafeWalkRequestForm from './SafeWalkRequestForm';

interface SafetyFeaturesProps {
  onClose: () => void;
}

const SafetyFeatures: React.FC<SafetyFeaturesProps> = ({ onClose }) => {
  const [showSafeWalkForm, setShowSafeWalkForm] = useState(false);
  const supportEmail = 'hustlapp@outlook.com';
  const supportMailto = `mailto:${supportEmail}?subject=Safety%20Question`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {showSafeWalkForm ? (
          <SafeWalkRequestForm onClose={() => setShowSafeWalkForm(false)} />
        ) : (
          <>
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center">
                <Shield className="w-6 h-6 text-[#0F2557] mr-2" />
                Safety Features
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-4">Your Safety is Our Priority</h3>
                <p className="text-gray-600">
                  We've implemented comprehensive safety measures to ensure a secure environment for all users.
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FeatureCard
                  icon={<Users className="w-8 h-8 text-[#0F2557]" />}
                  title="User Verification"
                  description="All users undergo a verification process including student ID verification and optional background checks."
                />

                <FeatureCard
                  icon={<MapPin className="w-8 h-8 text-[#0F2557]" />}
                  title="Location Tracking"
                  description="Optional real-time location sharing during task completion for added security."
                />

                <FeatureCard
                  icon={<Bell className="w-8 h-8 text-[#0F2557]" />}
                  title="Emergency Alerts"
                  description="Quick access to emergency services and campus security with one-tap alert system."
                />

                <FeatureCard
                  icon={<AlertTriangle className="w-8 h-8 text-[#0F2557]" />}
                  title="Report System"
                  description="Easy-to-use reporting system for flagging suspicious behavior or safety concerns."
                />
              </div>

              <section className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Safe Walk Feature</h3>
                <p className="text-gray-600 mb-4">
                  Need someone to walk with you? Use our Safe Walk feature to connect with verified student companions.
                </p>
                <button 
                  onClick={() => setShowSafeWalkForm(true)}
                  className="bg-[#0F2557] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0A1B3D] transition duration-200"
                >
                  Request Safe Walk
                </button>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-4">Emergency Contacts</h3>
                <div className="space-y-4">
                  <EmergencyContact
                    title="Campus Police"
                    number="(352) 392-1111"
                  />
                  <EmergencyContact
                    title="UFPD Non-Emergency"
                    number="(352) 392-5447"
                  />
                  <EmergencyContact
                    title="Student Nighttime Auxiliary Patrol"
                    number="(352) 392-SNAP"
                  />
                </div>
              </section>

              <section className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Safety Tips</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-[#0F2557] mr-2 mt-0.5" />
                    <span>Always meet in public, well-lit areas on campus</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-[#0F2557] mr-2 mt-0.5" />
                    <span>Share your task details and location with a friend</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-[#0F2557] mr-2 mt-0.5" />
                    <span>Trust your instincts - if something feels off, report it</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-[#0F2557] mr-2 mt-0.5" />
                    <span>Keep your personal information private</span>
                  </li>
                </ul>
              </section>

              <section className="text-center">
                <h3 className="text-lg font-semibold mb-3">Have Safety Questions?</h3>
                <p className="text-gray-600 mb-4">Our safety team is available 24/7 to assist you</p>
                <a
                  href={supportMailto}
                  className="inline-block bg-[#0F2557] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0A1B3D] transition duration-200 flex items-center justify-center mx-auto max-w-xs"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Safety Team
                </a>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="mb-4">{icon}</div>
    <h4 className="text-lg font-semibold mb-2">{title}</h4>
    <p className="text-gray-600">{description}</p>
  </div>
);

const EmergencyContact = ({ title, number }) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center">
      <Phone className="w-5 h-5 text-[#0F2557] mr-3" />
      <span className="font-medium">{title}</span>
    </div>
    <a
      href={`tel:${number.replace(/[^0-9]/g, '')}`}
      className="text-[#0F2557] font-semibold hover:text-[#0A1B3D]"
    >
      {number}
    </a>
  </div>
);

export default SafetyFeatures;