import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  const sections = [
    {
      title: 'Introduction',
      content:
        'Master System Design ("we" or "us" or "our") operates the website. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices associated with that data.',
    },
    {
      title: 'Information Collection and Use',
      content:
        'We collect several different types of information for various purposes to provide and improve our Service to you:',
      items: [
        'Personal Data: While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). This may include, but is not limited to:',
        'Email address, Username, First name and last name, Phone number, Address, State, Province, ZIP/Postal code, City, Cookies and Usage Data',
        'Usage Data: We may also collect information on how the Service is accessed and used ("Usage Data"). This may include information such as your computer\'s Internet Protocol address, browser type, browser version, the pages you visit, the time and date of your visit, and other diagnostic data.',
      ],
    },
    {
      title: 'Security of Data',
      content:
        'The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.',
    },
    {
      title: 'Tracking & Analytics',
      content:
        'We may use third-party Service Providers to monitor and analyze the use of our Service. This includes tools for understanding user behavior, device information, and interaction patterns. This information helps us improve our Service and user experience.',
    },
    {
      title: 'Communications',
      content:
        'We may use your Personal Data to contact you with newsletters, marketing or promotional materials and other information that may be of interest to you. You may opt out of any of these communications at any time by clicking the unsubscribe link or notifying us directly.',
    },
    {
      title: 'Cookies',
      content:
        'We use Cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if you do not accept Cookies, you may not be able to use some portions of our Service.',
    },
    {
      title: 'Children\'s Privacy',
      content:
        'Our Service is not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that we have collected Personal Data from a child under 13 without verification of parental consent, we take steps to remove such information and terminate the child\'s account.',
    },
    {
      title: 'Changes to This Privacy Policy',
      content:
        'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.',
    },
    {
      title: 'Contact Us',
      content:
        'If you have any questions about this Privacy Policy, please contact us by email at support@mastersystemdesign.com or through the contact form on our website.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all mb-8 group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Home</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Privacy <span className="text-primary">Policy</span>
          </h1>
          <p className="text-lg text-foreground/70">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Content Sections */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-10"
        >
          {sections.map((section, index) => (
            <motion.section
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              className="neu-card p-8"
            >
              <h2 className="text-2xl font-bold mb-4 text-primary">{section.title}</h2>
              <p className="text-foreground/80 leading-relaxed mb-4">{section.content}</p>
              {section.items && (
                <ul className="space-y-2 ml-4">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex gap-3 text-foreground/75">
                      <span className="text-primary font-bold mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.section>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 p-8 neu-card-blue rounded-lg text-center"
        >
          <p className="text-foreground/80 mb-4">
            Your privacy is important to us. If you have concerns, reach out to us.
          </p>
          <Link to="#contact" className="inline-block neu-btn-blue px-8 py-3 font-semibold">
            Contact Support
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
