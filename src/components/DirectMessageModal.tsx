import React, { useState, useEffect } from 'react';
import { X, Search, User, MessageSquare, Send, Loader } from 'lucide-react';
import { auth } from '../lib/firebase';
import { messageService, profileService } from '../lib/database';
import toast from 'react-hot-toast';

interface DirectMessageModalProps {
  onClose: () => void;
}

const DirectMessageModal: React.FC<DirectMessageModalProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = contacts.filter(contact => 
        contact.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get all chat threads for this user
      const chatThreads = await messageService.getUserChatThreads(user.uid);
      
      // Extract unique user IDs from chat threads
      const contactProfiles = chatThreads.map(thread => thread.other_user).filter(Boolean);
      
      // Remove duplicates by ID
      const uniqueContacts = Array.from(
        new Map(contactProfiles.map(profile => [profile.id, profile])).values()
      );
      
      // Sort by name
      uniqueContacts.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      setContacts(uniqueContacts);
      setFilteredContacts(uniqueContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Error loading contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSelect = async (contact: any) => {
    setSelectedContact(contact);
    
    try {
      // Find or create a chat thread between the users
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }
      
      const threadId = await messageService.findOrCreateChatThread(
        user.uid,
        contact.id
      );
      
      setChatThreadId(threadId);
    } catch (error) {
      console.error('Error initializing chat thread:', error);
      toast.error('Error initializing chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedContact || !chatThreadId) return;

    try {
      setSendingMessage(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Send the message
      await messageService.sendMessage(chatThreadId, {
        sender_id: user.uid,
        recipient_id: selectedContact.id,
        content: message.trim(),
        message_type: 'text',
        is_read: false
      });
      
      toast.success('Message sent successfully');
      setMessage('');
      onClose();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error sending message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white rounded-t-xl">
          <h2 className="text-xl font-bold flex items-center">
            <MessageSquare className="w-6 h-6 mr-2" />
            New Message
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col h-[70vh]">
          {selectedContact ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    {selectedContact.avatar_url ? (
                      <img
                        src={selectedContact.avatar_url}
                        alt={selectedContact.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{selectedContact.full_name}</h3>
                    <p className="text-xs text-gray-500">{selectedContact.major || 'UF Student'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 bg-gray-50">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
                  <p className="text-center text-gray-500 mb-4">
                    This is the beginning of your conversation with {selectedContact.full_name}.
                  </p>
                  
                  <div className="flex-1"></div>
                  
                  <div className="mt-auto">
                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-[#0038FF] focus:ring-1 focus:ring-[#0038FF] focus:outline-none"
                        rows={3}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendingMessage}
                        className="absolute bottom-3 right-3 p-2 bg-[#0038FF] text-white rounded-full hover:bg-[#0021A5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF]"
                  />
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0038FF]"></div>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                    <MessageSquare className="w-12 h-12 mb-2" />
                    <p>No contacts found</p>
                    <p className="text-sm text-center mt-2">
                      You can message people you've previously shared a task with
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleContactSelect(contact)}
                        className="w-full p-4 hover:bg-gray-50 transition-colors flex items-center text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          {contact.avatar_url ? (
                            <img
                              src={contact.avatar_url}
                              alt={contact.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{contact.full_name}</h3>
                          <p className="text-sm text-gray-500">{contact.major || 'UF Student'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessageModal;