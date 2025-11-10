import React, { useState } from 'react';

interface FooterProps {
  onGoToAdmin: () => void;
}

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div 
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    onClick={onClose}
    aria-modal="true"
    role="dialog"
  >
    <style>{`
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
    `}</style>
    <div 
      className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg mx-auto p-6 border border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        <button 
          onClick={onClose} 
          className="text-text-secondary hover:text-accent transition-colors"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
        </button>
      </div>
      <div>
        {children}
      </div>
    </div>
  </div>
);

const AboutContent: React.FC = () => (
    <div className="space-y-4 text-text-secondary">
        <p><strong>Global Gist Blog</strong> is your #1 source for global insights. We are an independent journalism hub dedicated to distilling the world's most fascinating stories, trends, and facts into clear, engaging blog posts.</p>
        <p>Our mission is to provide content that is not only entertaining but also highly informative and trustworthy. Every article is crafted to ensure accuracy and comprehensiveness, grounded in real-world data and legitimate sources.</p>
        <p>Powered by <strong>Legit info (LI)</strong>, we combine the best of human curiosity and journalistic expertise to keep you informed and inspired.</p>
    </div>
);

const ContactContent: React.FC = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("Thank you for your message! This is a demo form and your message has not been sent.");
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-text-secondary mb-4">Have a question or a story tip? We'd love to hear from you. Please note, this is a placeholder form for demonstration purposes.</p>
            <div>
                <label htmlFor="contact-name" className="sr-only">Name</label>
                <input id="contact-name" type="text" placeholder="Your Name" required className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary" />
            </div>
             <div>
                <label htmlFor="contact-email" className="sr-only">Email</label>
                <input id="contact-email" type="email" placeholder="Your Email" required className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary" />
            </div>
             <div>
                <label htmlFor="contact-message" className="sr-only">Message</label>
                <textarea id="contact-message" placeholder="Your Message..." required rows={5} className="w-full bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary" />
            </div>
            <button type="submit" className="w-full bg-accent hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-300">
                Send Message
            </button>
        </form>
    );
};


const NewsletterSignup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim() && email.includes('@')) {
            // In a real app, you'd send this to a backend service.
            // For this demo, we'll just show a success message.
            setIsSubmitted(true);
            setEmail('');
            setTimeout(() => setIsSubmitted(false), 5000); // Reset after 5 seconds
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center p-4 bg-green-900/50 border border-green-500 rounded-lg transition-all duration-300">
                <p className="font-bold text-green-300">Thank you for subscribing!</p>
                <p className="text-sm text-green-400">You're now on the list for the latest gists.</p>
            </div>
        );
    }

    return (
        <div className="text-center">
            <h3 className="text-xl font-bold text-text-primary">Stay Updated</h3>
            <p className="text-text-secondary mt-2 mb-4 max-w-md mx-auto">
                Subscribe to our newsletter to get the latest global gists delivered straight to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    aria-label="Email address for newsletter"
                    className="flex-grow bg-primary p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-text-primary placeholder-text-secondary"
                />
                <button
                    type="submit"
                    className="bg-accent hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-md transition-colors duration-300"
                >
                    Subscribe
                </button>
            </form>
        </div>
    );
};

export const Footer: React.FC<FooterProps> = ({ onGoToAdmin }) => {
  const [activeModal, setActiveModal] = useState<'about' | 'contact' | null>(null);

  return (
    <>
      <footer className="bg-secondary/50 border-t border-white/10 mt-12">
        <div className="container mx-auto px-4 py-10 space-y-8">
          <NewsletterSignup />
          <div className="text-center text-text-secondary text-sm pt-8 border-t border-white/10">
            <p>&copy; {new Date().getFullYear()} Global Gist Blog. powered by Legit info (LI)</p>
            <div className="mt-4 flex justify-center items-center space-x-4 text-xs">
              <button onClick={() => setActiveModal('about')} className="hover:text-accent hover:underline transition-colors">
                About Us
              </button>
              <span className="text-text-secondary/50">|</span>
              <button onClick={() => setActiveModal('contact')} className="hover:text-accent hover:underline transition-colors">
                Contact
              </button>
              <span className="text-text-secondary/50">|</span>
              <button onClick={onGoToAdmin} className="hover:text-accent hover:underline transition-colors">
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </footer>
      
      {activeModal === 'about' && (
        <Modal title="About Us" onClose={() => setActiveModal(null)}>
            <AboutContent />
        </Modal>
      )}

      {activeModal === 'contact' && (
        <Modal title="Contact Us" onClose={() => setActiveModal(null)}>
            <ContactContent />
        </Modal>
      )}
    </>
  );
};