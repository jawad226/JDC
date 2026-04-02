'use client';

import { 
  HelpCircle, 
  MessageSquare, 
  BookOpen, 
  ShieldQuestion, 
  Mail, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

const FAQS = [
  {
    question: "How do I clock in/out?",
    answer: "On your dashboard, you'll find a large 'Start' button. Click it to clock in when you begin your shift. Once you're done, the button will change to 'Stop', which you can click to clock out. The system automatically records your hours."
  },
  {
    question: "What is a 'Late Mark'?",
    answer: "A late mark is automatically applied if you clock in after 9:00 AM. This is tracked for attendance purposes, though specific policies regarding late marks depend on your HR department."
  },
  {
    question: "How do I request leave?",
    answer: "Navigate to the 'My Requests' page using the sidebar. There you can fill out a form specifying the type of leave (Sick, Casual, or Paid) and the date range. Your request will then be sent to HR for approval."
  },
  {
    question: "Can I edit my availability?",
    answer: "Yes, you can manage your standard working hours in the 'Availability' section. Note that this is for your general schedule; specific day-off requests should still be handled via the 'My Requests' page."
  },
  {
    question: "Who can see my timesheet?",
    answer: "Your timesheet is visible to you, your immediate HR manager, and the system Administrators. It is kept secure and used primarily for payroll and performance tracking."
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header section with search-like feel */}
      <div className="text-center py-12 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-blue-400 rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl" />
        
        <HelpCircle className="w-16 h-16 mx-auto mb-6 opacity-80" />
        <h1 className="text-4xl font-light tracking-tight mb-4">How can we help you today?</h1>
        <p className="text-blue-100 max-w-lg mx-auto">
          Find answers to common questions about the Global Digital Care system or get in touch with our support team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Support Cards */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">User Guides</h2>
          <p className="text-slate-500 text-sm mb-6">Detailed documentation on all features and workflows.</p>
          <button className="flex items-center text-blue-600 font-semibold text-sm group-hover:gap-2 transition-all">
            Read Docs <ExternalLink className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Live Chat</h2>
          <p className="text-slate-500 text-sm mb-6">Speak with our HR representatives in real-time.</p>
          <button className="flex items-center text-purple-600 font-semibold text-sm group-hover:gap-2 transition-all">
            Start Chat <ExternalLink className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Email Support</h2>
          <p className="text-slate-500 text-sm mb-6">Send us a detailed query and we'll reply within 24 hours.</p>
          <button className="flex items-center text-orange-600 font-semibold text-sm group-hover:gap-2 transition-all">
            Email Us <ExternalLink className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12">
        {/* FAQ Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-8">
             <ShieldQuestion className="text-blue-500 w-8 h-8" />
             <h2 className="text-2xl font-semibold text-slate-800">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div 
                key={idx} 
                className={`border rounded-2xl transition-all ${
                  openFaq === idx ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 bg-white hover:bg-slate-50/50'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className={`font-semibold ${openFaq === idx ? 'text-blue-700' : 'text-slate-700'}`}>
                    {faq.question}
                  </span>
                  {openFaq === idx ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-slate-600 leading-relaxed text-sm">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full md:w-80 space-y-6">
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
               <h3 className="text-lg font-bold mb-4">Urgent Issue?</h3>
               <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                 For immediate security concerns or if you cannot log in, please call our emergency HR hotline.
               </p>
               <div className="text-2xl font-serif font-bold text-blue-400 tracking-wider">
                 +1 (800) GDC-CARE
               </div>
             </div>
             <ShieldQuestion className="absolute -bottom-8 -right-8 w-32 h-32 text-slate-800 opacity-50 rotate-12" />
          </div>
          
          <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100">
             <h3 className="font-bold text-blue-800 mb-2">Pro Tip</h3>
             <p className="text-xs text-blue-700 leading-relaxed font-medium">
               You can view your total hours and overtime for the current week directly in the **Timesheet** section. Keep an eye on it to stay on track with your weekly goals!
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
