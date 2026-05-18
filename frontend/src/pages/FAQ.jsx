import React, { useState } from 'react';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid #eee', padding: '20px 0' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          textAlign: 'left', 
          background: 'none', 
          border: 'none', 
          fontSize: '1.2rem', 
          fontWeight: '600', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          padding: '10px 0',
          color: '#1a1a1a'
        }}
      >
        {question}
        <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
      </button>
      {isOpen && (
        <div style={{ padding: '10px 0 20px', color: '#666', fontSize: '1rem', animation: 'fadeIn 0.3s ease' }}>
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const faqs = [
    {
      question: "What material are the frames made of?",
      answer: "Our premium frames are made from high-quality teak wood and high-grade synthetic polymers depending on the collection. Each frame is finished with a protective coating to ensure longevity."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping takes 5-7 business days across India. Custom frames may take an additional 2-3 days for preparation."
    },
    {
      question: "Do you offer international shipping?",
      answer: "Currently, we only ship within India. We are working on expanding our reach to international customers soon."
    },
    {
      question: "Can I customize the size of the frame?",
      answer: "Yes! We offer standard sizes (8x10, 12x15, 16x20 inches), but if you need a specific size, you can contact us through the Custom Frame page or email us."
    },
    {
      question: "Is the glass included in the frame?",
      answer: "Most of our frames come with premium acrylic glass which is shatterproof and has high clarity, making it safer for shipping and home use."
    }
  ];

  return (
    <div className="faq-page" style={{ padding: '80px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>Frequently Asked Questions</h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '50px' }}>Everything you need to know about our products and services.</p>
      
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <FAQItem key={index} {...faq} />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
};

export default FAQ;
