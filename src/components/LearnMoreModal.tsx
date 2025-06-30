import React from 'react';
import { X, Zap, Shield, DollarSign, Users, Star, Clock, Mail, Phone, Award, Trophy, BookOpen, Briefcase, GraduationCap, Coffee, Package, ArrowRight } from 'lucide-react';

interface LearnMoreModalProps {
  onClose: () => void;
}

const LearnMoreModal: React.FC<LearnMoreModalProps> = ({ onClose }) => {
  const supportEmail = 'hustlapp@outlook.com';
  const supportMailto = `mailto:${supportEmail}?subject=Learn More About Hustl`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-lg">
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="w-6 h-6 text-[#FA4616] mr-2" />
            About Us
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 bg-white/10 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <section className="mb-12">
            <div className="flex flex-col md:flex-row items-center mb-8">
              <div className="md:w-1/2 md:pr-8">
                <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Our Story</h3>
                <p className="text-gray-600 mb-4">
                  Hustl was born from the collective experiences of students across campus who recognized a simple truth: we all need help sometimes, and we all have the capacity to help others.
                </p>
                <p className="text-gray-600">
                  What started as a simple idea to connect students for quick tasks has grown into a thriving community platform. Our team of passionate students from diverse backgrounds and majors came together with a shared vision: to make campus life easier through collaboration.
                </p>
              </div>
              <div className="md:w-1/2 mt-6 md:mt-0">
                <div className="relative rounded-lg overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-105">
                  <img
                    src="https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=format&fit=crop&w=800&q=80"
                    alt="Students collaborating"
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                    <h4 className="text-white font-bold text-xl">Created By Students, For Students</h4>
                    <p className="text-white/90 text-sm">Making campus life better together</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-xl border border-blue-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center text-white shadow-lg mr-4">
                    <GraduationCap className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Our Team</h4>
                    <p className="text-gray-600">Student Innovators</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  Our diverse team brings together students from Computer Science, Business, Psychology, Engineering, and more. We understand campus life because we live it every day.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-xl border border-orange-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF5A1F] to-[#E63A0B] rounded-full flex items-center justify-center text-white shadow-lg mr-4">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Our Approach</h4>
                    <p className="text-gray-600">Community-Centered</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  We believe in building technology that strengthens real-world connections. Every feature is designed to foster a helpful, safe community environment.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-xl border border-green-200/50 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-full flex items-center justify-center text-white shadow-lg mr-4">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">Our Values</h4>
                    <p className="text-gray-600">Safety & Trust</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  We prioritize creating a safe platform where students can connect with confidence. Our verification system, secure payments, and safety features are at the core of everything we do.
                </p>
              </div>
            </div>
          </section>

          <section className="py-8 border-t border-b border-gray-200 mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-[#0038FF] mr-2" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Our Mission</span>
            </h3>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-gray-700 mb-6">
                We believe in the power of community and connection. Hustl exists to solve the everyday challenges students face on campus by bringing them together to help each other succeed.
              </p>
              <p className="text-lg text-gray-700 mb-6">
                Our mission is to create a platform that:
              </p>
              <ul className="space-y-4 mb-6">
                <li className="flex items-start transform transition-all duration-500 hover:translate-x-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full mr-3 mt-1 shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Fosters Community</h4>
                    <p className="text-gray-600">Creates meaningful connections between students who might never otherwise meet</p>
                  </div>
                </li>
                <li className="flex items-start transform transition-all duration-500 hover:translate-x-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full mr-3 mt-1 shadow-md">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Saves Time</h4>
                    <p className="text-gray-600">Helps students focus on what matters by making everyday tasks more efficient</p>
                  </div>
                </li>
                <li className="flex items-start transform transition-all duration-500 hover:translate-x-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full mr-3 mt-1 shadow-md">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Creates Opportunities</h4>
                    <p className="text-gray-600">Provides flexible earning opportunities that work with unpredictable student schedules</p>
                  </div>
                </li>
                <li className="flex items-start transform transition-all duration-500 hover:translate-x-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full mr-3 mt-1 shadow-md">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Prioritizes Safety</h4>
                    <p className="text-gray-600">Ensures all interactions are secure, transparent, and built on trust</p>
                  </div>
                </li>
              </ul>
              <p className="text-lg text-gray-700">
                Whether it's getting coffee during a study session, picking up notes when you're sick, or finding a study buddy for that difficult class, Hustl makes it easy to find help or earn money by helping others.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
              <Award className="w-8 h-8 text-[#0038FF] mr-2" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">How Hustl Works</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <Package className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Post Your Task</h3>
                <p className="text-gray-600">
                  Describe what you need help with, set your budget, and choose a convenient location on campus.
                </p>
              </div>

              <div className="flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Get Matched</h3>
                <p className="text-gray-600">
                  Connect with verified students nearby who are ready to help with your task.
                </p>
              </div>

              <div className="flex flex-col items-center text-center transform transition-all duration-500 hover:scale-105">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mb-6 shadow-xl">
                  <Star className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Complete & Pay</h3>
                <p className="text-gray-600">
                  Once your task is done, rate your helper and pay securely through our platform.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-[#0038FF] mr-2" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Popular Task Categories</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=format&fit=crop&w=500&q=80" 
                    alt="Coffee Run" 
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex items-center mb-2">
                        <Coffee className="w-5 h-5 text-[#FA4616] mr-2" />
                        <h4 className="font-bold text-white">Coffee Runs</h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Quick coffee deliveries during study sessions or between classes.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=format&fit=crop&w=500&q=80" 
                    alt="Academic Help" 
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex items-center mb-2">
                        <GraduationCap className="w-5 h-5 text-[#FA4616] mr-2" />
                        <h4 className="font-bold text-white">Academic Support</h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Note sharing, study group formation, and printing services.
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=format&fit=crop&w=500&q=80" 
                    alt="Pet Care" 
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-4 w-full">
                      <div className="flex items-center mb-2">
                        <Shield className="w-5 h-5 text-[#FA4616] mr-2" />
                        <h4 className="font-bold text-white">Pet Care</h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Dog walking, pet sitting, and care assistance for busy students.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg my-8 sm:my-12 shadow-xl border border-blue-100/50 transform transition-all duration-500 hover:scale-105">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-2 bg-blue-400/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Join the Hustl Community</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">Be part of a growing network of students helping each other succeed and make campus life easier.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="/app"
                className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-8 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition duration-200 shadow-xl flex items-center justify-center"
              >
                Go to App
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <a
                href={supportMailto}
                className="bg-white border border-[#0F2557] text-[#0F2557] px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition duration-200 inline-flex items-center justify-center shadow-lg"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LearnMoreModal;