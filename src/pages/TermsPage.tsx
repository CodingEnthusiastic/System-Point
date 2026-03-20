import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermsPage() {
  const sections = [
    {
      title: 'Agreement to Terms',
      content:
        'By accessing and using the Master System Design application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
    },
    {
      title: 'Use License',
      content:
        'Permission is granted to temporarily download one copy of the materials (information or software) on Master System Design for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:',
      items: [
        'Modifying or copying the materials',
        'Using the materials for any commercial purpose or for any public display (commercial or non-commercial)',
        'Attempting to decompile or reverse engineer any software contained on Master System Design',
        'Removing any copyright or other proprietary notations from the materials',
        'Transferring the materials to another person or "mirroring" the materials on any other server',
      ],
    },
    {
      title: 'Disclaimer',
      content:
        'The materials on Master System Design are provided on an "as is" basis. Master System Design makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties included without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
    },
    {
      title: 'Limitations',
      content:
        'In no event shall Master System Design or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Master System Design, even if Master System Design or a Master System Design authorized representative has been notified orally or in writing of the possibility of such damage.',
    },
    {
      title: 'Accuracy of Materials',
      content:
        'The materials appearing on Master System Design could include technical, typographical, or photographic errors. Master System Design does not warrant that any of the materials on its website are accurate, complete, or current. Master System Design may make changes to the materials contained on its website at any time without notice.',
    },
    {
      title: 'Links',
      content:
        'Master System Design has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Master System Design of the site. Use of any such linked website is at the user\'s own risk.',
    },
    {
      title: 'Modifications',
      content:
        'Master System Design may revise these terms of service for our website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.',
    },
    {
      title: 'Governing Law',
      content:
        'These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
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
            Terms & <span className="text-primary">Conditions</span>
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
            If you have any questions about these Terms & Conditions, please contact us.
          </p>
          <Link to="#contact" className="inline-block neu-btn-blue px-8 py-3 font-semibold">
            Contact Us
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
