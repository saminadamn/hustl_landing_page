import React, { useState } from 'react';
import { X, HelpCircle, Mail, MessageSquare, Shield, DollarSign, Bot } from 'lucide-react';
import ChatbotSupport from './ChatbotSupport';

interface FAQSupportProps {
  onClose: () => void;
}

const FAQSupport: React.FC<FAQSupportProps> = ({ onClose }) => {
  const [showChatbot, setShowChatbot] = useState(false);
  const supportEmail = 'hustlapp@outlook.com';
  const mailtoLink = `mailto:${supportEmail}?subject=Hustl Support Request`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center">
            <HelpCircle className="w-6 h-6 text-[#0021A5] mr-2" />
            Help & Support
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <SupportCard
              icon={<Bot className="w-8 h-8 text-[#0021A5]" />}
              title="AI Chat Support"
              description="Get instant answers from our AI assistant"
              action="Start Chat"
              onClick={() => setShowChatbot(true)}
            />
            <SupportCard
              icon={<Mail className="w-8 h-8 text-[#0021A5]" />}
              title="Email Support"
              description="Send us an email for detailed assistance"
              action="Send Email"
              onClick={() => window.location.href = mailtoLink}
            />
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <FAQItem
                  question="How does payment work?"
                  answer="Payments are processed securely through our platform. Funds are held in escrow until the task is completed and both parties are satisfied."
                />
                <FAQItem
                  question="What if something goes wrong during a task?"
                  answer={`We have a 24/7 support team ready to assist. Contact us at ${supportEmail} or use our emergency features and report system for immediate help.`}
                />
                <FAQItem
                  question="How do I verify my account?"
                  answer="Upload your student ID and complete the verification steps in your profile settings. This helps build trust in the community."
                />
                <FAQItem
                  question="Can I cancel a task?"
                  answer="Yes, you can cancel a task before it's accepted. Once accepted, you'll need to communicate with the other party through our chat system."
                />
              </div>
            </section>

            <section className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <QuickLink
                  icon={<Shield className="w-5 h-5 text-[#0021A5]" />}
                  title="Safety Guidelines"
                  href={`mailto:${supportEmail}?subject=Safety Guidelines Request`}
                />
                <QuickLink
                  icon={<DollarSign className="w-5 h-5 text-[#0021A5]" />}
                  title="Payment Info"
                  href={`mailto:${supportEmail}?subject=Payment Information Request`}
                />
                <QuickLink
                  icon={<MessageSquare className="w-5 h-5 text-[#0021A5]" />}
                  title="Community Rules"
                  href={`mailto:${supportEmail}?subject=Community Rules Request`}
                />
                <QuickLink
                  icon={<HelpCircle className="w-5 h-5 text-[#0021A5]" />}
                  title="Tutorial"
                  href={`mailto:${supportEmail}?subject=Tutorial Request`}
                />
              </div>
            </section>

            <section className="text-center bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
              <p className="text-gray-600 mb-4">Our support team is available 24/7 to assist you</p>
              <div className="space-x-4">
                <button
                  onClick={() => setShowChatbot(true)}
                  className="bg-[#0021A5] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#001B8C] transition duration-200"
                >
                  Chat with AI
                </button>
                <a
                  href={mailtoLink}
                  className="inline-block bg-white border border-[#0021A5] text-[#0021A5] px-6 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-200"
                >
                  Email Support
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showChatbot && <ChatbotSupport onClose={() => setShowChatbot(false)} />}
    </div>
  );
};

const SupportCard = ({ icon, title, description, action, onClick }) => (
  <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
    <div className="mb-4">{icon}</div>
    <h4 className="text-lg font-semibold mb-2">{title}</h4>
    <p className="text-gray-600 mb-4">{description}</p>
    <button 
      onClick={onClick}
      className="text-[#0021A5] font-semibold hover:text-[#001B8C]"
    >
      {action} →
    </button>
  </div>
);

const FAQItem = ({ question, answer }) => (
  <details className="group">
    <summary className="flex justify-between items-center cursor-pointer list-none">
      <span className="font-medium">{question}</span>
      <ChevronIcon />
    </summary>
    <p className="mt-2 text-gray-600 pl-4">{answer}</p>
  </details>
);

const QuickLink = ({ icon, title, href }) => (
  <a
    href={href}
    className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg w-full"
  >
    {icon}
    <span>{title}</span>
  </a>
);

const ChevronIcon = () => (
  <svg
    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

export default FAQSupport;