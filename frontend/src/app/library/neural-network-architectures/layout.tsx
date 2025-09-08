import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Neural Network Architectures - Menttor Library',
  description: 'Comprehensive guide to neural network architectures in deep learning research, covering feedforward networks, CNNs, RNNs, and Transformers.',
  keywords: 'neural networks, deep learning, CNN, RNN, transformer, architecture',
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}