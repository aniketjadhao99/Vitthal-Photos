const products = [
  // God Category
  {
    name: 'Lord Ganesha Frame',
    description: 'Beautiful Lord Ganesha frame for prosperity and good beginnings.',
    category: 'God',
    basePrice: 1299,
    stock: 50,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuA3DgY-zNs72yCHVJFYJAkK0SSbL9NOORmRV8YV8irhZD5e11LwGKbgL6G1APl9megiA8xN6EZ6BxUiSyKX7E2lNpqrpM2lryaHqmFNUBlXrpLZSxzj4wx34QcEhnhye79ySSbxfrslcVe7qAxIQCGWK9K2u1wVjoPEQO1oHCJxF_nIrA4eyVtcvgwyS_2PyBZTk-2Xb9Wwq3hyHNayHROxabcMs_rrrMgJ7tXZErV1lmEaV9KTJnN_EeiJB1dwpJbrPW3UrLsG-Bh7'],
    variants: {
      sizes: [
        { size: '12x15', priceModifier: 0 },
        { size: '15x20', priceModifier: 500 }
      ],
      colors: [{ name: 'Gold', hexCode: '#FFD700' }]
    }
  },
  {
    name: 'Shri Vitthal Rukhmini',
    description: 'Divine Vitthal Rukhmini frame, perfect for your altar.',
    category: 'God',
    basePrice: 1499,
    stock: 30,
    images: ['assets/images/ready frames.png'],
    variants: {
      sizes: [
        { size: '12x15', priceModifier: 0 },
        { size: '18x24', priceModifier: 800 }
      ],
      colors: [{ name: 'Natural Wood', hexCode: '#8B4513' }]
    }
  },

  // Warrior Category
  {
    name: 'Chhatrapati Shivaji Maharaj',
    description: 'Inspiring frame of Chhatrapati Shivaji Maharaj.',
    category: 'Warriors',
    basePrice: 2499,
    stock: 40,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDBQY7ykrBR6FZmwb3uuEFcxdTetmoOIZq_EViD2f88SJTRFMQy8odRPz_4OFIVUa-MJSvtajSy726W9o1yQTpmtL0LTH5bp6zqU8Qj9VdIQ1tcMhnnK0naCwrde4hF8kXtLAr1nHBZoLzLwTqAewCTfvgckiwNtHOHWKWL7zDqpcPhfM04zUR97L-R61Pff8Pzym2AMijDmTak-NfUvzAeycGuQuhUgfdXPMvjYWBslqntr7IXtffpTI9Vtzlg-U-QybON0e5rOj2j'],
    variants: {
      sizes: [
        { size: '16x20', priceModifier: 0 },
        { size: '20x30', priceModifier: 1000 }
      ],
      colors: [{ name: 'Black', hexCode: '#000000' }]
    }
  },
  {
    name: 'Rajmata Jijau',
    description: 'Tribute to Rajmata Jijau, a symbol of strength.',
    category: 'Warriors',
    basePrice: 1999,
    stock: 20,
    images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuDBQY7ykrBR6FZmwb3uuEFcxdTetmoOIZq_EViD2f88SJTRFMQy8odRPz_4OFIVUa-MJSvtajSy726W9o1yQTpmtL0LTH5bp6zqU8Qj9VdIQ1tcMhnnK0naCwrde4hF8kXtLAr1nHBZoLzLwTqAewCTfvgckiwNtHOHWKWL7zDqpcPhfM04zUR97L-R61Pff8Pzym2AMijDmTak-NfUvzAeycGuQuhUgfdXPMvjYWBslqntr7IXtffpTI9Vtzlg-U-QybON0e5rOj2j'],
    variants: {
      sizes: [
        { size: '12x15', priceModifier: 0 }
      ],
      colors: [{ name: 'Brown', hexCode: '#A52A2A' }]
    }
  },

  // New Arrivals / Other
  {
    name: 'Custom Mosaic Frame',
    description: 'A unique mosaic art frame for modern homes.',
    category: 'New',
    basePrice: 1599,
    stock: 15,
    images: ['assets/images/ready frames.png'],
    variants: {
      sizes: [{ size: 'Standard', priceModifier: 0 }]
    }
  }
];

module.exports = products;