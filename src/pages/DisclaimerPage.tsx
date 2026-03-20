import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DisclaimerPage() {
  const sections = [
    {
      title: 'General Disclaimer',
      content:
        'The content provided on Master System Design, including all articles, video courses, quizzes, and educational materials, is for educational and informational purposes only. While we strive to provide accurate and current information, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the content.',
    },
    {
      title: 'No Professional Advice',
      content:
        'The information provided on this website is not intended to be, and should not be construed as, professional advice. The content is not a substitute for professional advice from qualified experts in system design, software engineering, or related fields. Before making any decisions based on the information on this website, consult with a qualified professional.',
    },
    {
      title: 'Educational Content Only',
      content:
        'All course materials, including videos, articles, and quizzes, are designed for educational purposes only. The examples and case studies provided are simplified representations and may not reflect real-world complexity. Actual system design decisions should be based on specific requirements and professional consultation.',
    },
    {
      title: 'No Liability for Errors',
      content:
        'In no event shall Master System Design, its creators, contributors, or any affiliated parties be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from the use of or reliance on any content on this website, including but not limited to:',
      items: [
        'Loss of data or information',
        'Loss of profit or business opportunities',
        'System failures or downtime',
        'Any implementation errors or failures',
        'Damages to equipment or software',
      ],
    },
    {
      title: 'Third-Party Content',
      content:
        'Master System Design may contain links to third-party websites and resources. We are not responsible for the content, accuracy, or practices of these external sites. Your use of third-party websites is governed by their own terms and conditions. We do not endorse or guarantee any third-party content.',
    },
    {
      title: 'Course Content Disclaimer',
      content:
        'The system design principles and patterns taught in our courses are based on industry best practices and experiences. However, the effectiveness of any system design depends on numerous factors including specific requirements, constraints, and implementation details. Results may vary based on individual circumstances and implementations.',
    },
    {
      title: 'Technology and Tools',
      content:
        'While we reference various technologies, tools, and frameworks in our content, we do not guarantee their accuracy, compatibility, or suitability for your specific use case. Technology landscapes change rapidly, and some information may become outdated. Always verify current documentation and best practices.',
    },
    {
      title: 'Quiz and Assessment Disclaimer',
      content:
        'Quizzes and assessments on this platform are for learning purposes only. Scores do not represent professional certification or qualification. They should not be used as the sole basis for hiring, promotion, or other professional decisions.',
    },
    {
      title: 'User Responsibility',
      content:
        'By using Master System Design, you acknowledge and agree that you use the content at your own risk. You are responsible for evaluating the accuracy, completeness, and usefulness of all content before using it. We recommend independent verification and professional consultation for critical decisions.',
    },
    {
      title: 'Changes to Disclaimer',
      content:
        'Master System Design reserves the right to modify this disclaimer at any time. Changes are effective immediately upon posting to the website. Your continued use of the website constitutes your acceptance of the modified disclaimer.',
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
            <span className="text-primary">Disclaimer</span>
          </h1>
          <p className="text-lg text-foreground/70">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Alert Box */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mb-12 p-6 neu-card border-l-4 border-primary flex gap-4"
        >
          <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-2">Important Notice</h3>
            <p className="text-foreground/80">
              Please read this disclaimer carefully before using Master System Design. By accessing and using this website, you agree to be bound by the terms outlined below.
            </p>
          </div>
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
            Questions about this disclaimer? Get in touch with our support team.
          </p>
          <Link to="#contact" className="inline-block neu-btn-blue px-8 py-3 font-semibold">
            Contact Us
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
