import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

// Component that automatically optimizes performance based on device capabilities
const PerformanceOptimizer = () => {
  const [deviceTier, setDeviceTier] = useState<'high' | 'medium' | 'low'>('medium');
  const [networkSpeed, setNetworkSpeed] = useState<'fast' | 'slow'>('fast');

  useEffect(() => {
    // Detect device capabilities
    const detectDeviceCapabilities = () => {
      const memory = (navigator as any).deviceMemory || 4; // Default to 4GB
      const cores = navigator.hardwareConcurrency || 4;
      
      // Categorize device
      if (memory >= 8 && cores >= 8) {
        setDeviceTier('high');
      } else if (memory >= 4 && cores >= 4) {
        setDeviceTier('medium');
      } else {
        setDeviceTier('low');
      }
    };

    // Detect network speed
    const detectNetworkSpeed = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const { effectiveType, downlink } = connection;
        if (effectiveType === '4g' && downlink > 10) {
          setNetworkSpeed('fast');
        } else {
          setNetworkSpeed('slow');
        }
      }
    };

    detectDeviceCapabilities();
    detectNetworkSpeed();

    // Apply optimizations based on device tier
    applyOptimizations();

    // Monitor performance
    performanceMonitor.measureWebVitals();
  }, [deviceTier, networkSpeed]);

  const applyOptimizations = () => {
    // Add performance optimizations based on device capabilities
    const root = document.documentElement;
    
    if (deviceTier === 'low') {
      // Reduce animations for low-end devices
      root.style.setProperty('--animation-duration', '0.1s');
      root.style.setProperty('--transition-duration', '0.1s');
    } else if (deviceTier === 'medium') {
      root.style.setProperty('--animation-duration', '0.2s');
      root.style.setProperty('--transition-duration', '0.2s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
      root.style.setProperty('--transition-duration', '0.3s');
    }

    // Network-based optimizations
    if (networkSpeed === 'slow') {
      // Reduce image quality for slow networks
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        if (img.src && !img.src.includes('w_400')) {
          // Add image optimization parameters if using a service like Cloudinary
          const url = new URL(img.src);
          if (url.hostname.includes('res.cloudinary.com')) {
            img.src = img.src.replace(/w_\d+/, 'w_400,q_70');
          }
        }
      });
    }
  };

  // This component doesn't render anything, it just applies optimizations
  return null;
};

export default PerformanceOptimizer;